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
    const { username, password, environment, cid, sec } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const env = environment === "live" ? "live" : "demo";
    const baseUrl = env === "live" ? TRADOVATE_LIVE_URL : TRADOVATE_DEMO_URL;

    // Generate a stable device ID for this app instance
    const deviceId = `copytrader-${Buffer.from(username).toString('base64').substring(0, 12)}`;

    // Proxy the authentication request to Tradovate server-side (avoids CORS)
    const tradovateResponse = await fetch(
      `${baseUrl}/auth/accessTokenRequest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          password: password,
          appId: "CopyTrader",
          appVersion: "1.0",
          ...(cid && sec ? { cid: Number(cid), sec } : {}),
          deviceId,
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

    // Fetch account list - try multiple approaches
    let accounts: { id: string; name: string }[] = [];
    const debugInfo: string[] = [];

    // Log auth response fields for debugging
    const tokenFields = Object.keys(data);
    debugInfo.push(`Auth response fields: ${tokenFields.join(", ")}`);

    // Try different token fields
    const token = data.accessToken || data["p-ticket"] || data.token;
    if (!token) {
      debugInfo.push(`No token found in auth response. Available: ${JSON.stringify(data).substring(0, 200)}`);
    } else {
      debugInfo.push(`Token obtained (${String(token).substring(0, 10)}...)`);
    }

    // Approach 1: Try GET /account/list first, then POST if GET fails
    if (token) {
      try {
        // Try GET first
        let accountsResponse = await fetch(`${baseUrl}/account/list`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        // If GET returns 401 or 405, try POST (Tradovate accepts both for some endpoints)
        if (!accountsResponse.ok && (accountsResponse.status === 401 || accountsResponse.status === 405)) {
          debugInfo.push(`GET /account/list returned ${accountsResponse.status}, trying POST...`);
          accountsResponse = await fetch(`${baseUrl}/account/list`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: "{}",
          });
        }

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
          const errText = await accountsResponse.text();
          debugInfo.push(`/account/list final status: ${accountsResponse.status} - ${errText.substring(0, 150)}`);
        }
      } catch (err) {
        debugInfo.push(`/account/list error: ${String(err)}`);
      }
    }

    // Approach 2: Try /tradingPermission/list
    if (accounts.length === 0 && token) {
      try {
        // Try GET first
        let permResponse = await fetch(`${baseUrl}/tradingPermission/list`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        // If GET returns 401 or 405, try POST
        if (!permResponse.ok && (permResponse.status === 401 || permResponse.status === 405)) {
          debugInfo.push(`GET /tradingPermission/list returned ${permResponse.status}, trying POST...`);
          permResponse = await fetch(`${baseUrl}/tradingPermission/list`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: "{}",
          });
        }

        if (permResponse.ok) {
          const permData = await permResponse.json();
          debugInfo.push(`/tradingPermission/list returned ${Array.isArray(permData) ? permData.length : 0} items`);

          if (Array.isArray(permData) && permData.length > 0) {
            const accountIds = Array.from(new Set(permData.map((p: Record<string, unknown>) => p.accountId)));
            debugInfo.push(`Permission account IDs: ${JSON.stringify(accountIds)}`);

            for (const accId of accountIds) {
              try {
                let accResponse = await fetch(`${baseUrl}/account/item?id=${accId}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                });

                if (!accResponse.ok && (accResponse.status === 401 || accResponse.status === 405)) {
                  accResponse = await fetch(`${baseUrl}/account/item`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: accId }),
                  });
                }

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

    // Approach 3: /user/syncRequest
    if (accounts.length === 0 && token) {
      try {
        const syncResponse = await fetch(`${baseUrl}/user/syncRequest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: [data.userId] }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          debugInfo.push(`/user/syncRequest returned keys: ${Object.keys(syncData).join(", ")}`);

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
      accessToken: token,
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
