"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/metrics/kpi-card";
import { EquityCurveChart } from "@/components/metrics/equity-curve-chart";
import { WinRateGauge } from "@/components/dashboard/win-rate-gauge";
import { ProfitFactorGauge } from "@/components/dashboard/profit-factor-gauge";
import { formatCurrency } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo-mode";
import {
  DollarSign,
  Wallet,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardMetrics {
  metrics: {
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
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

// Fully static mock equity curve - 30 data points with no randomness
const staticEquityCurve: Array<{ date: string; equity: number }> = [
  { date: "2025-01-01", equity: 50000.0 },
  { date: "2025-01-02", equity: 50320.45 },
  { date: "2025-01-03", equity: 50185.3 },
  { date: "2025-01-04", equity: 50542.18 },
  { date: "2025-01-05", equity: 50410.62 },
  { date: "2025-01-06", equity: 50875.9 },
  { date: "2025-01-07", equity: 51032.55 },
  { date: "2025-01-08", equity: 50890.2 },
  { date: "2025-01-09", equity: 51245.8 },
  { date: "2025-01-10", equity: 51580.35 },
  { date: "2025-01-11", equity: 51420.1 },
  { date: "2025-01-12", equity: 51795.45 },
  { date: "2025-01-13", equity: 52010.7 },
  { date: "2025-01-14", equity: 51860.25 },
  { date: "2025-01-15", equity: 52235.9 },
  { date: "2025-01-16", equity: 52480.15 },
  { date: "2025-01-17", equity: 52310.6 },
  { date: "2025-01-18", equity: 52675.85 },
  { date: "2025-01-19", equity: 52890.4 },
  { date: "2025-01-20", equity: 52745.2 },
  { date: "2025-01-21", equity: 53120.55 },
  { date: "2025-01-22", equity: 53350.9 },
  { date: "2025-01-23", equity: 53180.45 },
  { date: "2025-01-24", equity: 53545.7 },
  { date: "2025-01-25", equity: 53780.25 },
  { date: "2025-01-26", equity: 53620.8 },
  { date: "2025-01-27", equity: 53985.15 },
  { date: "2025-01-28", equity: 54210.6 },
  { date: "2025-01-29", equity: 54050.35 },
  { date: "2025-01-30", equity: 54432.5 },
];

const mockMetrics: DashboardMetrics = {
  metrics: {
    totalPnl: 4832.5,
    totalTrades: 142,
    winRate: 0.64,
    profitFactor: 2.15,
    maxDrawdown: 1250,
    sharpeRatio: 1.87,
    equityCurve: staticEquityCurve,
  },
  accountCount: 3,
  activeAccountCount: 2,
};

const mockRecentTrades: RecentTrade[] = [
  { id: "t1", symbol: "ES", side: "long", quantity: 2, pnl: 425.0, status: "closed", openedAt: "2025-01-30T14:30:00Z" },
  { id: "t2", symbol: "NQ", side: "short", quantity: 1, pnl: -175.0, status: "closed", openedAt: "2025-01-30T13:15:00Z" },
  { id: "t3", symbol: "ES", side: "long", quantity: 3, pnl: 612.5, status: "closed", openedAt: "2025-01-30T11:45:00Z" },
  { id: "t4", symbol: "RTY", side: "long", quantity: 2, pnl: null, status: "open", openedAt: "2025-01-30T10:20:00Z" },
  { id: "t5", symbol: "NQ", side: "long", quantity: 1, pnl: 287.5, status: "closed", openedAt: "2025-01-30T09:00:00Z" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export function DashboardOverview() {
  const demo = isDemoMode();

  // In demo mode: initialize with mock data directly
  // In production mode: initialize with null/empty and fetch from API
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(demo ? mockMetrics : null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(demo ? mockRecentTrades : []);
  const [groupCount, setGroupCount] = useState(demo ? 2 : 0);
  const [loading, setLoading] = useState(!demo);

  useEffect(() => {
    if (demo) return; // In demo mode, skip API fetching

    async function fetchData() {
      try {
        const [metricsRes, groupsRes, tradesRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/groups?limit=1"),
          fetch("/api/trades?limit=5"),
        ]);

        if (metricsRes.ok) {
          const data = await metricsRes.json();
          if (data?.metrics && data.metrics.totalTrades > 0) {
            setMetrics({
              metrics: {
                totalPnl: data.metrics.totalPnl ?? 0,
                totalTrades: data.metrics.totalTrades ?? 0,
                winRate: data.metrics.winRate ?? 0,
                profitFactor: data.metrics.profitFactor ?? 0,
                maxDrawdown: data.metrics.maxDrawdown ?? 0,
                sharpeRatio: data.metrics.sharpeRatio ?? 0,
                equityCurve: data.metrics.equityCurve?.length > 0
                  ? data.metrics.equityCurve
                  : [],
              },
              accountCount: data.accountCount ?? 0,
              activeAccountCount: data.activeAccountCount ?? 0,
            });
          }
        }

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          if (data.pagination?.total > 0) {
            setGroupCount(data.pagination.total);
          }
        }

        if (tradesRes.ok) {
          const data = await tradesRes.json();
          if (data.trades && data.trades.length > 0) {
            setRecentTrades(data.trades.map((t: Record<string, unknown>) => ({
              id: t.id as string,
              symbol: t.symbol as string,
              side: t.side as string,
              quantity: t.quantity as number,
              pnl: t.pnl as number | null,
              status: t.status as string,
              openedAt: t.openedAt as string,
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [demo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  // No data available in production mode
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">Welcome to Copy Trading</p>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your trading accounts to see metrics here. Once your accounts are synced, your dashboard will populate with real-time data.
          </p>
          <Link
            href="/accounts"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Add Trading Account
          </Link>
        </div>
      </div>
    );
  }

  const m = metrics.metrics;

  return (
    <div className="space-y-6">
      {/* Row 1: 6 KPI Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Total PnL"
            value={formatCurrency(m.totalPnl)}
            trend={m.totalPnl > 0 ? "up" : m.totalPnl < 0 ? "down" : "neutral"}
            icon={<DollarSign className="h-4 w-4" />}
            href="/metrics"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Total Trades"
            value={String(m.totalTrades)}
            trend="neutral"
            trendValue={`${Math.round(m.winRate * 100)}% win rate`}
            icon={<Activity className="h-4 w-4" />}
            href="/metrics"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Win Rate"
            value={`${Math.round(m.winRate * 100)}%`}
            trend={m.winRate > 0.5 ? "up" : "down"}
            icon={<TrendingUp className="h-4 w-4" />}
            href="/metrics"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Profit Factor"
            value={`${m.profitFactor.toFixed(2)}x`}
            trend={m.profitFactor > 1 ? "up" : "down"}
            icon={<BarChart3 className="h-4 w-4" />}
            href="/metrics"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Active Accounts"
            value={String(metrics.activeAccountCount)}
            trend="neutral"
            trendValue={`${metrics.accountCount} total`}
            icon={<Wallet className="h-4 w-4" />}
            href="/accounts"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Active Groups"
            value={String(groupCount)}
            trend="neutral"
            icon={<Users className="h-4 w-4" />}
            href="/groups"
          />
        </motion.div>
      </motion.div>

      {/* Row 2: Win Rate Gauge + Profit Factor Gauge side by side */}
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="text-center">Win Rate</CardTitle>
            </CardHeader>
            <CardContent className="relative flex justify-center pb-6">
              <WinRateGauge value={m.winRate} />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="text-center">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent className="relative flex justify-center pb-6">
              <ProfitFactorGauge value={m.profitFactor} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 3: Equity Curve (full width) */}
      {m.equityCurve.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <EquityCurveChart data={m.equityCurve} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 4: Recent Trades (full width) */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between relative">
            <CardTitle>Recent Trades</CardTitle>
            <Link
              href="/trades"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="relative">
            {recentTrades.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Trade history will appear here as your accounts sync.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left font-medium p-2 text-muted-foreground">Symbol</th>
                      <th className="text-left font-medium p-2 text-muted-foreground">Side</th>
                      <th className="text-right font-medium p-2 text-muted-foreground">Qty</th>
                      <th className="text-right font-medium p-2 text-muted-foreground">PnL</th>
                      <th className="text-center font-medium p-2 text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade, index) => (
                      <motion.tr
                        key={trade.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.5 + index * 0.08,
                          ease: "easeOut",
                        }}
                        className={`border-b border-border/30 ${
                          index % 2 === 1 ? "bg-muted/30" : ""
                        }`}
                      >
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
                        <td className="p-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              trade.status === "open"
                                ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                                : trade.status === "closed"
                                  ? "bg-green-500/15 text-green-500 border border-green-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {trade.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
