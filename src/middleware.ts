export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/accounts/:path*", "/groups/:path*", "/metrics/:path*"],
};
