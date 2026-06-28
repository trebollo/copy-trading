"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  entryPrice: number;
  pnl: number | null;
  status: "open" | "closed";
  openedAt: string;
}

type SortField = "openedAt" | "symbol" | "side" | "quantity" | "entryPrice" | "pnl" | "status";
type SortDirection = "asc" | "desc";

function generateMockTrades(): Trade[] {
  const symbols = ["ES", "NQ", "RTY", "YM"];
  const sides: ("buy" | "sell")[] = ["buy", "sell"];
  const trades: Trade[] = [];

  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const symbol = symbols[i % symbols.length];
    const side = sides[i % 2];
    const status = i < 5 ? "open" : "closed";
    const daysAgo = Math.floor(i / 4);
    const hour = (i * 3) % 24; // Spread across all hours to cover sessions
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

    let entryPrice: number;
    switch (symbol) {
      case "ES":
        entryPrice = 5200 + Math.random() * 100;
        break;
      case "NQ":
        entryPrice = 18500 + Math.random() * 500;
        break;
      case "RTY":
        entryPrice = 2050 + Math.random() * 50;
        break;
      case "YM":
        entryPrice = 39000 + Math.random() * 500;
        break;
      default:
        entryPrice = 1000;
    }

    const pnl = status === "closed"
      ? Math.round((Math.random() * 1200 - 400) * 100) / 100
      : null;

    trades.push({
      id: `trade-${i + 1}`,
      symbol,
      side,
      quantity: Math.floor(Math.random() * 5) + 1,
      entryPrice: Math.round(entryPrice * 100) / 100,
      pnl,
      status,
      openedAt: date.toISOString(),
    });
  }

  return trades;
}

const mockTrades = generateMockTrades();

export function TradesPageContent() {
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("openedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...mockTrades];

    // Apply filters
    if (symbolFilter !== "all") {
      filtered = filtered.filter((t) => t.symbol === symbolFilter);
    }
    if (sideFilter !== "all") {
      filtered = filtered.filter((t) => t.side === sideFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "openedAt":
          comparison = new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "side":
          comparison = a.side.localeCompare(b.side);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "entryPrice":
          comparison = a.entryPrice - b.entryPrice;
          break;
        case "pnl":
          comparison = (a.pnl ?? 0) - (b.pnl ?? 0);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [symbolFilter, sideFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedTrades.length / pageSize);
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  }

  function handleFilterChange() {
    setCurrentPage(1);
  }

  const uniqueSymbols = Array.from(new Set(mockTrades.map((t) => t.symbol))).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Trades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Symbol:</span>
            <Select
              value={symbolFilter}
              onValueChange={(v) => {
                setSymbolFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {uniqueSymbols.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Side:</span>
            <Select
              value={sideFilter}
              onValueChange={(v) => {
                setSideFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort("openedAt")}
                  >
                    Date/Time
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort("symbol")}
                  >
                    Symbol
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort("side")}
                  >
                    Side
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <button
                    className="flex items-center gap-1 ml-auto hover:text-foreground"
                    onClick={() => handleSort("quantity")}
                  >
                    Quantity
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <button
                    className="flex items-center gap-1 ml-auto hover:text-foreground"
                    onClick={() => handleSort("entryPrice")}
                  >
                    Entry Price
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <button
                    className="flex items-center gap-1 ml-auto hover:text-foreground"
                    onClick={() => handleSort("pnl")}
                  >
                    PnL
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(trade.openedAt, "MMM dd HH:mm")}
                  </td>
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
                    {formatCurrency(trade.entryPrice)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedTrades.length} total trades
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
