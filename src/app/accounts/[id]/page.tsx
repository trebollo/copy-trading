"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TradesTable, type TradeRow } from "@/components/accounts/trades-table";
import {
  AccountPnlChart,
  type DailyMetricData,
} from "@/components/accounts/account-pnl-chart";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TradingPlatform } from "@/lib/trading/types";
import { PnlCalendar } from "@/components/metrics/pnl-calendar";
import { isDemoMode } from "@/lib/demo-mode";

// Sample data for demo mode only
const sampleTrades: TradeRow[] = [
  {
    id: "t1",
    symbol: "ESZ4",
    side: "buy",
    quantity: 2,
    price: 5890.25,
    pnl: 450.0,
    status: "closed",
    openedAt: "2024-01-15T09:30:00Z",
  },
  {
    id: "t2",
    symbol: "NQZ4",
    side: "sell",
    quantity: 1,
    price: 20150.75,
    pnl: -125.5,
    status: "closed",
    openedAt: "2024-01-15T10:15:00Z",
  },
  {
    id: "t3",
    symbol: "ESZ4",
    side: "buy",
    quantity: 3,
    price: 5895.0,
    pnl: null,
    status: "open",
    openedAt: "2024-01-15T14:00:00Z",
  },
  {
    id: "t4",
    symbol: "CLF5",
    side: "sell",
    quantity: 2,
    price: 72.35,
    pnl: 280.0,
    status: "closed",
    openedAt: "2024-01-14T11:20:00Z",
  },
  {
    id: "t5",
    symbol: "GCG5",
    side: "buy",
    quantity: 1,
    price: 2045.6,
    pnl: 120.0,
    status: "closed",
    openedAt: "2024-01-14T13:45:00Z",
  },
];

const sampleMetrics: DailyMetricData[] = [
  { date: "2024-01-01", pnl: 150, trades: 3 },
  { date: "2024-01-02", pnl: -75, trades: 2 },
  { date: "2024-01-03", pnl: 300, trades: 5 },
  { date: "2024-01-04", pnl: 200, trades: 4 },
  { date: "2024-01-05", pnl: -50, trades: 2 },
  { date: "2024-01-08", pnl: 425, trades: 6 },
  { date: "2024-01-09", pnl: -125, trades: 3 },
  { date: "2024-01-10", pnl: 350, trades: 4 },
  { date: "2024-01-11", pnl: 175, trades: 3 },
  { date: "2024-01-12", pnl: -200, trades: 4 },
  { date: "2024-01-15", pnl: 500, trades: 5 },
];

const sampleAccount = {
  id: "1",
  name: "Apex Funded 50K",
  platform: TradingPlatform.TRADOVATE,
  accountId: "APX-50001",
  balance: 52340.0,
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T14:30:00Z",
};

const platformLabels: Record<string, string> = {
  [TradingPlatform.TRADOVATE]: "Tradovate",
  [TradingPlatform.NINJATRADER]: "NinjaTrader",
  [TradingPlatform.RITHMIC]: "Rithmic",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  error: "destructive",
};

interface AccountData {
  id: string;
  name: string;
  platform: string;
  accountId: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  const demo = isDemoMode();

  const [account, setAccount] = useState<AccountData | null>(
    demo ? { ...sampleAccount, id: accountId || sampleAccount.id } : null
  );
  const [trades, _setTrades] = useState<TradeRow[]>(demo ? sampleTrades : []);
  const [metrics, setMetrics] = useState<DailyMetricData[]>(demo ? sampleMetrics : []);
  const [loading, setLoading] = useState(!demo);

  useEffect(() => {
    if (demo) return;

    async function fetchAccountData() {
      try {
        const res = await fetch(`/api/accounts/${accountId}`);
        if (res.ok) {
          const data = await res.json();
          setAccount({
            id: data.id,
            name: data.name,
            platform: data.platform,
            accountId: data.accountId,
            balance: data.balance ?? 0,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      } catch (error) {
        console.error("Failed to fetch account:", error);
      }

      try {
        const metricsRes = await fetch(`/api/metrics/${accountId}`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          if (metricsData.metrics?.equityCurve?.length > 0) {
            const dailyData: DailyMetricData[] = metricsData.metrics.equityCurve.map(
              (point: { date: string; equity: number }, i: number, arr: Array<{ date: string; equity: number }>) => ({
                date: point.date,
                pnl: i === 0 ? 0 : point.equity - arr[i - 1].equity,
                trades: 0,
              })
            );
            setMetrics(dailyData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }

      setLoading(false);
    }

    fetchAccountData();
  }, [demo, accountId]);

  const totalPnl = trades.reduce(
    (sum, trade) => sum + (trade.pnl || 0),
    0
  );

  const handleSync = async () => {
    if (!account) return;
    if (demo) {
      setAccount((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      toast.success("Account synced successfully");
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${accountId}/sync`, { method: "POST" });
      if (res.ok) {
        const synced = await res.json();
        setAccount((prev) => prev ? {
          ...prev,
          balance: synced.balance ?? prev.balance,
          updatedAt: synced.updatedAt ?? new Date().toISOString(),
        } : prev);
        toast.success("Account synced successfully");
      } else {
        toast.error("Failed to sync account");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync account");
    }
  };

  const handleEditSettings = () => {
    toast.info("Edit settings dialog coming soon");
  };

  const handleViewInGroup = () => {
    router.push("/groups");
    toast.info("Navigating to groups...");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading account details...
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Account not found</h2>
            <p className="text-sm text-muted-foreground">
              This account could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {account.name}
              </h2>
              <Badge variant={statusVariants[account.status] || "outline"}>
                {account.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {platformLabels[account.platform] || account.platform} - {account.accountId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleViewInGroup}>
            <Users className="mr-2 h-4 w-4" />
            View in Group
          </Button>
          <Button variant="outline" size="sm" onClick={handleEditSettings}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Settings
          </Button>
          <Button size="sm" onClick={handleSync}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(account.balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PnL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalPnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(totalPnl)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatDate(account.updatedAt, "MMM dd, HH:mm")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PnL Chart */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PnL Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountPnlChart data={metrics} />
          </CardContent>
        </Card>
      )}

      {/* PnL Calendar */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PnL Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlCalendar data={metrics} />
          </CardContent>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No trades recorded yet. Trades will appear here after account sync.
            </div>
          ) : (
            <TradesTable trades={trades} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
