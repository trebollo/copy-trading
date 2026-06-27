"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/metrics/kpi-card";
import { EquityCurveChart } from "@/components/metrics/equity-curve-chart";
import { DailyPnlChart } from "@/components/metrics/daily-pnl-chart";
import {
  AccountComparisonTable,
  AccountMetricRow,
} from "@/components/metrics/account-comparison-table";
import { DateRangePicker, DateRange } from "@/components/metrics/date-range-picker";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Target,
  TrendingDown,
  BarChart3,
  Activity,
  Calendar,
} from "lucide-react";

interface AggregatedMetrics {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  bestDay: number;
  worstDay: number;
  equityCurve: Array<{ date: string; equity: number }>;
}

interface MetricsResponse {
  metrics: AggregatedMetrics;
  accountCount: number;
  activeAccountCount: number;
}

export function MetricsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [accountMetrics, setAccountMetrics] = useState<AccountMetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);

      const queryString = params.toString();
      const url = `/api/metrics${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchAccountMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      params.set("limit", "100");

      const accountsRes = await fetch(`/api/accounts?${params.toString()}`);
      if (!accountsRes.ok) return;

      const accountsData = await accountsRes.json();
      const accounts = accountsData.accounts || [];

      const accountRows: AccountMetricRow[] = [];
      for (const account of accounts) {
        try {
          const queryString = params.toString();
          const metricsUrl = `/api/metrics/${account.id}${queryString ? `?${queryString}` : ""}`;
          const res = await fetch(metricsUrl);
          if (res.ok) {
            const data = await res.json();
            accountRows.push({
              id: account.id,
              name: account.name,
              platform: account.platform,
              totalPnl: data.metrics.totalPnl,
              winRate: data.metrics.winRate,
              totalTrades: data.metrics.totalTrades,
              maxDrawdown: data.metrics.maxDrawdown,
              status: account.status,
            });
          }
        } catch {
          // Skip failed account metrics
        }
      }
      setAccountMetrics(accountRows);
    } catch (error) {
      console.error("Failed to fetch account metrics:", error);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchMetrics();
    fetchAccountMetrics();
  }, [fetchMetrics, fetchAccountMetrics]);

  const m = metrics?.metrics;

  const dailyPnlData =
    m?.equityCurve.map((point, i) => ({
      date: point.date,
      pnl:
        i === 0
          ? point.equity
          : point.equity - (m.equityCurve[i - 1]?.equity || 0),
    })) || [];

  return (
    <div className="space-y-6">
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-account">By Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading metrics...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                  label="Win Rate"
                  value={`${((m?.winRate || 0) * 100).toFixed(1)}%`}
                  trend={
                    (m?.winRate || 0) >= 0.5
                      ? "up"
                      : (m?.winRate || 0) > 0
                        ? "down"
                        : "neutral"
                  }
                  icon={<Target className="h-4 w-4" />}
                />
                <KpiCard
                  label="Profit Factor"
                  value={
                    m?.profitFactor === Infinity
                      ? "N/A"
                      : (m?.profitFactor || 0).toFixed(2)
                  }
                  trend={
                    (m?.profitFactor || 0) > 1
                      ? "up"
                      : (m?.profitFactor || 0) > 0
                        ? "down"
                        : "neutral"
                  }
                  icon={<BarChart3 className="h-4 w-4" />}
                />
                <KpiCard
                  label="Max Drawdown"
                  value={formatCurrency(m?.maxDrawdown || 0)}
                  trend={(m?.maxDrawdown || 0) > 0 ? "down" : "neutral"}
                  icon={<TrendingDown className="h-4 w-4" />}
                />
                <KpiCard
                  label="Total Trades"
                  value={String(m?.totalTrades || 0)}
                  trend="neutral"
                  icon={<Activity className="h-4 w-4" />}
                />
                <KpiCard
                  label="Best Day"
                  value={formatCurrency(m?.bestDay || 0)}
                  trend={(m?.bestDay || 0) > 0 ? "up" : "neutral"}
                  icon={<Calendar className="h-4 w-4" />}
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
                    <CardTitle>Daily PnL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DailyPnlChart data={dailyPnlData} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="by-account" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountComparisonTable accounts={accountMetrics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
