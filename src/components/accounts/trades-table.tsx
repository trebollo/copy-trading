"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface TradeRow {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  pnl: number | null;
  status: string;
  openedAt: string;
}

interface TradesTableProps {
  trades: TradeRow[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No trades yet. Trades will appear here once the account is synced.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Side</th>
            <th className="px-4 py-3 font-medium text-right">Qty</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">PnL</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="px-4 py-3 font-mono font-medium">
                {trade.symbol}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={trade.side === "buy" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {trade.side.toUpperCase()}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {trade.quantity}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {formatCurrency(trade.price)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {trade.pnl !== null ? (
                  <span
                    className={
                      trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatCurrency(trade.pnl)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs">
                  {trade.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(trade.openedAt, "MMM dd HH:mm")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
