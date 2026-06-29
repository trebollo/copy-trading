"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { MobileNav } from "@/components/shared/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
