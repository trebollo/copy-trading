"use client";

import { useState } from "react";
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

// Sample data for initial render (will be replaced by API calls)
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

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState(sampleAccount);
  const [trades] = useState<TradeRow[]>(sampleTrades);
  const [metrics] = useState<DailyMetricData[]>(sampleMetrics);

  const totalPnl = trades.reduce(
    (sum, trade) => sum + (trade.pnl || 0),
    0
  );

  const handleSync = () => {
    setAccount((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
    toast.success("Account synced successfully");
  };

  const handleEditSettings = () => {
    toast.info("Edit settings dialog coming soon");
  };

  const handleViewInGroup = () => {
    router.push("/groups");
    toast.info("Navigating to groups...");
  };

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
              {platformLabels[account.platform]} - {account.accountId}
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
      <Card>
        <CardHeader>
          <CardTitle>PnL Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountPnlChart data={metrics} />
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <TradesTable trades={trades} />
        </CardContent>
      </Card>
    </div>
  );
}
