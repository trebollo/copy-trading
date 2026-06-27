"use client";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface AccountMetricRow {
  id: string;
  name: string;
  platform: string;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  status: string;
}

interface AccountComparisonTableProps {
  accounts: AccountMetricRow[];
}

export function AccountComparisonTable({
  accounts,
}: AccountComparisonTableProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No account data available. Add trading accounts to see comparison.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left font-medium p-3">Account</th>
            <th className="text-left font-medium p-3">Platform</th>
            <th className="text-right font-medium p-3">Total PnL</th>
            <th className="text-right font-medium p-3">Win Rate</th>
            <th className="text-right font-medium p-3">Trades</th>
            <th className="text-right font-medium p-3">Max Drawdown</th>
            <th className="text-center font-medium p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b hover:bg-muted/50">
              <td className="p-3 font-medium">{account.name}</td>
              <td className="p-3 capitalize">{account.platform}</td>
              <td
                className={`p-3 text-right font-mono ${
                  account.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatCurrency(account.totalPnl)}
              </td>
              <td className="p-3 text-right">
                {(account.winRate * 100).toFixed(1)}%
              </td>
              <td className="p-3 text-right">{account.totalTrades}</td>
              <td className="p-3 text-right text-red-500">
                {formatCurrency(account.maxDrawdown)}
              </td>
              <td className="p-3 text-center">
                <Badge
                  variant={
                    account.status === "active" ? "default" : "secondary"
                  }
                >
                  {account.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
