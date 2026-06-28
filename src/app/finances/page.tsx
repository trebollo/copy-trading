import { Metadata } from "next";
import { FinancesPageContent } from "@/components/finances/finances-page";

export const metadata: Metadata = {
  title: "Finances | CopyTrader",
  description: "Track your trading expenses and payouts",
};

export default function FinancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Finances</h2>
        <p className="text-muted-foreground">
          Track your expenses, payouts, and net profit.
        </p>
      </div>
      <FinancesPageContent />
    </div>
  );
}
