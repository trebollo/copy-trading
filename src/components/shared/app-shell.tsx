"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { MobileNav } from "@/components/shared/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
