import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { MobileNav } from "@/components/shared/mobile-nav";

export const metadata: Metadata = {
  title: "CopyTrader - Trading Account Management Dashboard",
  description:
    "Manage funded trading accounts, create copy groups, and track performance metrics across multiple platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <MobileNav />
      </body>
    </html>
  );
}
