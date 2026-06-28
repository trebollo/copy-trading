import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // In demo mode, allow all routes without authentication
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next();
  }

  // Default behavior: require authentication via NextAuth
  const token = await getToken({ req: request });

  if (!token) {
    const signInUrl = new URL("/", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/accounts/:path*", "/groups/:path*", "/metrics/:path*", "/settings/:path*"],
};
