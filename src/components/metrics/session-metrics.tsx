"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SessionData {
  name: string;
  timeRange: string;
  pnl: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

const mockSessionData: SessionData[] = [
  {
    name: "Asian",
    timeRange: "00:00 - 08:00 UTC",
    pnl: 1245.5,
    winRate: 0.58,
    totalTrades: 32,
    profitFactor: 1.85,
  },
  {
    name: "London",
    timeRange: "08:00 - 13:00 UTC",
    pnl: 2187.0,
    winRate: 0.68,
    totalTrades: 55,
    profitFactor: 2.45,
  },
  {
    name: "New York",
    timeRange: "13:00 - 22:00 UTC",
    pnl: 1400.0,
    winRate: 0.62,
    totalTrades: 55,
    profitFactor: 2.1,
  },
];

export function SessionMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {mockSessionData.map((session) => (
        <Card key={session.name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{session.name} Session</CardTitle>
            <p className="text-sm text-muted-foreground">{session.timeRange}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">PnL</span>
              <span
                className={`text-sm font-medium font-mono ${
                  session.pnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(session.pnl)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="text-sm font-medium">
                {(session.winRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <span className="text-sm font-medium">{session.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Profit Factor</span>
              <span className="text-sm font-medium">
                {session.profitFactor.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
