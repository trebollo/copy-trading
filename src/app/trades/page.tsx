import { Suspense } from "react";
import { Metadata } from "next";
import { TradesPageContent } from "@/components/trades/trades-page";

export const metadata: Metadata = {
  title: "Trades | CopyTrader",
  description: "View and manage all your trades with filtering, sorting, and pagination.",
};

export default function TradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
        <p className="text-muted-foreground">
          View all your trades across accounts with filtering and sorting.
        </p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading trades...</div>}>
        <TradesPageContent />
      </Suspense>
    </div>
  );
}
