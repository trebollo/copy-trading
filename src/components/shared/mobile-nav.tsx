"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  BarChart3,
  ScrollText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/trades", label: "Trades", icon: ScrollText },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/finances", label: "Finances", icon: Receipt },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide on auth/landing pages
  const isAuthPage = pathname === "/" || pathname === "/login";
  if (isAuthPage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t bg-card py-2"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
