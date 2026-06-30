import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TRADOVATE_DEMO_URL = "https://demo.tradovateapi.com/v1";
const TRADOVATE_LIVE_URL = "https://live.tradovateapi.com/v1";

export async function POST(request: NextRequest) {
  try {
    // In demo mode, allow without session for testing
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (!isDemoMode) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { username, password, environment } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const env = environment === "live" ? "live" : "demo";
    const baseUrl = env === "live" ? TRADOVATE_LIVE_URL : TRADOVATE_DEMO_URL;

    // Proxy the authentication request to Tradovate server-side (avoids CORS)
    const tradovateResponse = await fetch(
      `${baseUrl}/auth/accessTokenRequest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          password: password,
          appId: "CopyTrading",
          appVersion: "1.0",
        }),
      }
    );

    if (!tradovateResponse.ok) {
      const errorText = await tradovateResponse.text();
      return NextResponse.json(
        {
          error: "Authentication failed",
          detail: errorText,
        },
        { status: tradovateResponse.status }
      );
    }

    const data = await tradovateResponse.json();
    const accessToken = data.accessToken;

    // Fetch account list - try multiple approaches
    let accounts: { id: string; name: string }[] = [];
    const debugInfo: string[] = [];

    // Approach 1: /account/list
    try {
      const accountsResponse = await fetch(`${baseUrl}/account/list`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        debugInfo.push(`/account/list returned ${Array.isArray(accountsData) ? accountsData.length : 0} items`);

        if (Array.isArray(accountsData) && accountsData.length > 0) {
          accounts = accountsData.map((acc: Record<string, unknown>) => ({
            id: String(acc.id ?? acc.accountId ?? ""),
            name: String(acc.nickname || acc.name || acc.displayName || `Account ${acc.id}`),
          }));
        }
      } else {
        debugInfo.push(`/account/list failed: ${accountsResponse.status}`);
      }
    } catch (err) {
      debugInfo.push(`/account/list error: ${String(err)}`);
    }

    // Approach 2: If no accounts found, try /tradingPermission/list
    if (accounts.length === 0) {
      try {
        const permResponse = await fetch(`${baseUrl}/tradingPermission/list`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (permResponse.ok) {
          const permData = await permResponse.json();
          debugInfo.push(`/tradingPermission/list returned ${Array.isArray(permData) ? permData.length : 0} items`);

          if (Array.isArray(permData) && permData.length > 0) {
            // Trading permissions reference accountId
            const accountIds = Array.from(new Set(permData.map((p: Record<string, unknown>) => p.accountId)));
            debugInfo.push(`Found account IDs from permissions: ${JSON.stringify(accountIds)}`);

            // Try to fetch each account by ID
            for (const accId of accountIds) {
              try {
                const accResponse = await fetch(`${baseUrl}/account/item?id=${accId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (accResponse.ok) {
                  const accData = await accResponse.json();
                  accounts.push({
                    id: String(accData.id ?? accId),
                    name: String(accData.nickname || accData.name || `Account ${accId}`),
                  });
                }
              } catch {
                // skip individual account fetch errors
              }
            }
          }
        } else {
          debugInfo.push(`/tradingPermission/list failed: ${permResponse.status}`);
        }
      } catch (err) {
        debugInfo.push(`/tradingPermission/list error: ${String(err)}`);
      }
    }

    // Approach 3: Try /user/syncRequest which returns comprehensive account data
    if (accounts.length === 0) {
      try {
        const syncResponse = await fetch(`${baseUrl}/user/syncRequest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: [data.userId] }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          debugInfo.push(`/user/syncRequest returned data`);

          if (syncData.accounts && Array.isArray(syncData.accounts)) {
            accounts = syncData.accounts.map((acc: Record<string, unknown>) => ({
              id: String(acc.id ?? ""),
              name: String(acc.nickname || acc.name || `Account ${acc.id}`),
            }));
          }
        } else {
          debugInfo.push(`/user/syncRequest failed: ${syncResponse.status}`);
        }
      } catch (err) {
        debugInfo.push(`/user/syncRequest error: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      accessToken,
      userId: data.userId,
      expirationTime: data.expirationTime,
      accounts,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("Tradovate connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Tradovate. Please try again later." },
      { status: 502 }
    );
  }
}
