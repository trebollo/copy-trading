"use client";

import { AppShell } from "@/components/shared/app-shell";

export default function TradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
