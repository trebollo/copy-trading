import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TRADOVATE_DEMO_URL = "https://demo.tradovateapi.com/v1";

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
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Proxy the authentication request to Tradovate server-side (avoids CORS)
    const tradovateResponse = await fetch(
      `${TRADOVATE_DEMO_URL}/auth/accessTokenRequest`,
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

    if (tradovateResponse.ok) {
      const data = await tradovateResponse.json();
      return NextResponse.json({
        success: true,
        userId: data.userId,
        expirationTime: data.expirationTime,
      });
    } else {
      const errorText = await tradovateResponse.text();
      return NextResponse.json(
        {
          error: "Authentication failed",
          detail: errorText,
        },
        { status: tradovateResponse.status }
      );
    }
  } catch (error) {
    console.error("Tradovate connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Tradovate. Please try again later." },
      { status: 502 }
    );
  }
}
