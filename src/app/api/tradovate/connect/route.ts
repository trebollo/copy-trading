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

    // Fetch account list with the token
    let accounts: { id: string; name: string }[] = [];
    try {
      const accountsResponse = await fetch(`${baseUrl}/account/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        accounts = (accountsData || []).map(
          (acc: { id: number; name: string }) => ({
            id: String(acc.id),
            name: acc.name,
          })
        );
      }
    } catch {
      // If account fetch fails, still return success with empty accounts
    }

    return NextResponse.json({
      success: true,
      accessToken,
      userId: data.userId,
      expirationTime: data.expirationTime,
      accounts,
    });
  } catch (error) {
    console.error("Tradovate connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Tradovate. Please try again later." },
      { status: 502 }
    );
  }
}
