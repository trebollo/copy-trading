import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TRADOVATE_DEMO_URL = "https://demo.tradovateapi.com/v1";
const TRADOVATE_LIVE_URL = "https://live.tradovateapi.com/v1";

export async function POST(request: NextRequest) {
  try {
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

    const baseUrl = environment === "live" ? TRADOVATE_LIVE_URL : TRADOVATE_DEMO_URL;

    // First authenticate
    const authResponse = await fetch(`${baseUrl}/auth/accessTokenRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: username,
        password: password,
        appId: "CopyTrading",
        appVersion: "1.0",
      }),
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: "Authentication failed. Please check credentials." },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken;

    // Then fetch accounts
    const accountsResponse = await fetch(`${baseUrl}/account/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!accountsResponse.ok) {
      const errText = await accountsResponse.text();
      console.error("Tradovate account list error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch accounts from Tradovate" },
        { status: 502 }
      );
    }

    const accountsData = await accountsResponse.json();
    const accounts = (accountsData || []).map(
      (acc: { id: number; name?: string; nickname?: string; active?: boolean }) => ({
        id: String(acc.id),
        name: acc.nickname || acc.name || `Account ${acc.id}`,
        active: acc.active ?? true,
      })
    );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Tradovate accounts error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Tradovate" },
      { status: 502 }
    );
  }
}
