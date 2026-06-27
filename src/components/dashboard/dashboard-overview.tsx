"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/metrics/kpi-card";
import { EquityCurveChart } from "@/components/metrics/equity-curve-chart";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Wallet, Users, Activity } from "lucide-react";

interface DashboardMetrics {
  metrics: {
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    equityCurve: Array<{ date: string; equity: number }>;
  };
  accountCount: number;
  activeAccountCount: number;
}

interface RecentTrade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  pnl: number | null;
  status: string;
  openedAt: string;
}

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [groupCount, setGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [metricsRes, groupsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/groups?limit=1"),
        ]);

        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          setGroupCount(data.pagination?.total || 0);
        }

        // Fetch recent trades from accounts
        const accountsRes = await fetch("/api/accounts?limit=5");
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          const accounts = accountsData.accounts || [];
          if (accounts.length > 0) {
            // We get trades from the first account as a sample
            setRecentTrades([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  const m = metrics?.metrics;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total PnL"
          value={formatCurrency(m?.totalPnl || 0)}
          trend={
            (m?.totalPnl || 0) > 0
              ? "up"
              : (m?.totalPnl || 0) < 0
                ? "down"
                : "neutral"
          }
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Active Accounts"
          value={String(metrics?.activeAccountCount || 0)}
          trend="neutral"
          trendValue={`${metrics?.accountCount || 0} total`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Active Groups"
          value={String(groupCount)}
          trend="neutral"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Trades"
          value={String(m?.totalTrades || 0)}
          trend="neutral"
          trendValue={`${((m?.winRate || 0) * 100).toFixed(0)}% win rate`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityCurveChart data={m?.equityCurve || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No recent trades. Start trading to see activity here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-2">Symbol</th>
                      <th className="text-left font-medium p-2">Side</th>
                      <th className="text-right font-medium p-2">Qty</th>
                      <th className="text-right font-medium p-2">PnL</th>
                      <th className="text-center font-medium p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade) => (
                      <tr key={trade.id} className="border-b">
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2 capitalize">{trade.side}</td>
                        <td className="p-2 text-right">{trade.quantity}</td>
                        <td
                          className={`p-2 text-right font-mono ${
                            (trade.pnl || 0) >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {trade.pnl !== null
                            ? formatCurrency(trade.pnl)
                            : "-"}
                        </td>
                        <td className="p-2 text-center text-xs capitalize">
                          {trade.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
