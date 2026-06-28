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

// Deterministic mock trades with fixed values for stable rendering
const mockTrades: Trade[] = [
  { id: "trade-1", symbol: "ES", side: "buy", quantity: 2, entryPrice: 5248.50, pnl: null, status: "open", openedAt: "2025-01-20T14:30:00.000Z" },
  { id: "trade-2", symbol: "NQ", side: "sell", quantity: 1, entryPrice: 18742.25, pnl: null, status: "open", openedAt: "2025-01-20T11:15:00.000Z" },
  { id: "trade-3", symbol: "RTY", side: "buy", quantity: 3, entryPrice: 2068.40, pnl: null, status: "open", openedAt: "2025-01-20T09:45:00.000Z" },
  { id: "trade-4", symbol: "YM", side: "sell", quantity: 1, entryPrice: 39245.00, pnl: null, status: "open", openedAt: "2025-01-20T06:20:00.000Z" },
  { id: "trade-5", symbol: "ES", side: "buy", quantity: 4, entryPrice: 5231.75, pnl: null, status: "open", openedAt: "2025-01-20T03:10:00.000Z" },
  { id: "trade-6", symbol: "NQ", side: "sell", quantity: 2, entryPrice: 18685.50, pnl: 345.20, status: "closed", openedAt: "2025-01-19T21:00:00.000Z" },
  { id: "trade-7", symbol: "RTY", side: "buy", quantity: 1, entryPrice: 2075.10, pnl: -128.45, status: "closed", openedAt: "2025-01-19T18:30:00.000Z" },
  { id: "trade-8", symbol: "YM", side: "sell", quantity: 3, entryPrice: 39180.00, pnl: 512.80, status: "closed", openedAt: "2025-01-19T15:45:00.000Z" },
  { id: "trade-9", symbol: "ES", side: "buy", quantity: 2, entryPrice: 5265.25, pnl: -87.30, status: "closed", openedAt: "2025-01-19T13:20:00.000Z" },
  { id: "trade-10", symbol: "NQ", side: "sell", quantity: 1, entryPrice: 18810.75, pnl: 224.60, status: "closed", openedAt: "2025-01-19T10:00:00.000Z" },
  { id: "trade-11", symbol: "RTY", side: "buy", quantity: 2, entryPrice: 2058.30, pnl: 156.90, status: "closed", openedAt: "2025-01-19T07:15:00.000Z" },
  { id: "trade-12", symbol: "YM", side: "sell", quantity: 1, entryPrice: 39320.50, pnl: -215.40, status: "closed", openedAt: "2025-01-19T04:30:00.000Z" },
  { id: "trade-13", symbol: "ES", side: "sell", quantity: 3, entryPrice: 5272.00, pnl: 438.75, status: "closed", openedAt: "2025-01-19T01:45:00.000Z" },
  { id: "trade-14", symbol: "NQ", side: "buy", quantity: 2, entryPrice: 18650.25, pnl: -312.50, status: "closed", openedAt: "2025-01-18T22:30:00.000Z" },
  { id: "trade-15", symbol: "RTY", side: "sell", quantity: 1, entryPrice: 2082.60, pnl: 89.20, status: "closed", openedAt: "2025-01-18T19:15:00.000Z" },
  { id: "trade-16", symbol: "YM", side: "buy", quantity: 2, entryPrice: 39095.00, pnl: 675.30, status: "closed", openedAt: "2025-01-18T16:00:00.000Z" },
  { id: "trade-17", symbol: "ES", side: "buy", quantity: 1, entryPrice: 5238.90, pnl: 192.45, status: "closed", openedAt: "2025-01-18T14:30:00.000Z" },
  { id: "trade-18", symbol: "NQ", side: "sell", quantity: 3, entryPrice: 18775.00, pnl: -178.90, status: "closed", openedAt: "2025-01-18T11:45:00.000Z" },
  { id: "trade-19", symbol: "RTY", side: "buy", quantity: 2, entryPrice: 2063.80, pnl: 267.15, status: "closed", openedAt: "2025-01-18T09:00:00.000Z" },
  { id: "trade-20", symbol: "YM", side: "sell", quantity: 1, entryPrice: 39410.25, pnl: 145.60, status: "closed", openedAt: "2025-01-18T06:15:00.000Z" },
  { id: "trade-21", symbol: "ES", side: "sell", quantity: 2, entryPrice: 5285.50, pnl: -56.80, status: "closed", openedAt: "2025-01-18T03:30:00.000Z" },
  { id: "trade-22", symbol: "NQ", side: "buy", quantity: 1, entryPrice: 18620.75, pnl: 534.25, status: "closed", openedAt: "2025-01-18T00:45:00.000Z" },
  { id: "trade-23", symbol: "RTY", side: "sell", quantity: 4, entryPrice: 2071.20, pnl: -142.30, status: "closed", openedAt: "2025-01-17T21:30:00.000Z" },
  { id: "trade-24", symbol: "YM", side: "buy", quantity: 2, entryPrice: 39150.00, pnl: 328.90, status: "closed", openedAt: "2025-01-17T18:15:00.000Z" },
  { id: "trade-25", symbol: "ES", side: "buy", quantity: 3, entryPrice: 5255.75, pnl: 412.50, status: "closed", openedAt: "2025-01-17T15:00:00.000Z" },
  { id: "trade-26", symbol: "NQ", side: "sell", quantity: 2, entryPrice: 18890.50, pnl: -267.80, status: "closed", openedAt: "2025-01-17T12:30:00.000Z" },
  { id: "trade-27", symbol: "RTY", side: "buy", quantity: 1, entryPrice: 2055.90, pnl: 78.45, status: "closed", openedAt: "2025-01-17T10:15:00.000Z" },
  { id: "trade-28", symbol: "YM", side: "sell", quantity: 3, entryPrice: 39275.75, pnl: 189.60, status: "closed", openedAt: "2025-01-17T07:00:00.000Z" },
  { id: "trade-29", symbol: "ES", side: "sell", quantity: 1, entryPrice: 5292.30, pnl: -345.20, status: "closed", openedAt: "2025-01-17T04:45:00.000Z" },
  { id: "trade-30", symbol: "NQ", side: "buy", quantity: 2, entryPrice: 18705.25, pnl: 623.40, status: "closed", openedAt: "2025-01-17T01:30:00.000Z" },
  { id: "trade-31", symbol: "RTY", side: "sell", quantity: 2, entryPrice: 2079.50, pnl: 95.70, status: "closed", openedAt: "2025-01-16T22:00:00.000Z" },
  { id: "trade-32", symbol: "YM", side: "buy", quantity: 1, entryPrice: 39050.00, pnl: -198.30, status: "closed", openedAt: "2025-01-16T19:30:00.000Z" },
  { id: "trade-33", symbol: "ES", side: "buy", quantity: 4, entryPrice: 5220.60, pnl: 756.80, status: "closed", openedAt: "2025-01-16T16:45:00.000Z" },
  { id: "trade-34", symbol: "NQ", side: "sell", quantity: 1, entryPrice: 18835.00, pnl: 112.35, status: "closed", openedAt: "2025-01-16T14:00:00.000Z" },
  { id: "trade-35", symbol: "RTY", side: "buy", quantity: 3, entryPrice: 2066.75, pnl: -89.60, status: "closed", openedAt: "2025-01-16T11:15:00.000Z" },
  { id: "trade-36", symbol: "YM", side: "sell", quantity: 2, entryPrice: 39365.50, pnl: 287.40, status: "closed", openedAt: "2025-01-16T08:30:00.000Z" },
  { id: "trade-37", symbol: "ES", side: "sell", quantity: 2, entryPrice: 5278.40, pnl: -423.15, status: "closed", openedAt: "2025-01-16T05:45:00.000Z" },
  { id: "trade-38", symbol: "NQ", side: "buy", quantity: 3, entryPrice: 18580.75, pnl: 445.90, status: "closed", openedAt: "2025-01-16T02:30:00.000Z" },
  { id: "trade-39", symbol: "RTY", side: "sell", quantity: 1, entryPrice: 2085.30, pnl: 167.25, status: "closed", openedAt: "2025-01-15T23:00:00.000Z" },
  { id: "trade-40", symbol: "YM", side: "buy", quantity: 2, entryPrice: 39125.25, pnl: -78.50, status: "closed", openedAt: "2025-01-15T20:15:00.000Z" },
  { id: "trade-41", symbol: "ES", side: "buy", quantity: 1, entryPrice: 5242.15, pnl: 298.60, status: "closed", openedAt: "2025-01-15T17:30:00.000Z" },
  { id: "trade-42", symbol: "NQ", side: "sell", quantity: 2, entryPrice: 18920.00, pnl: -156.75, status: "closed", openedAt: "2025-01-15T14:45:00.000Z" },
  { id: "trade-43", symbol: "RTY", side: "buy", quantity: 2, entryPrice: 2052.60, pnl: 234.80, status: "closed", openedAt: "2025-01-15T12:00:00.000Z" },
  { id: "trade-44", symbol: "YM", side: "sell", quantity: 1, entryPrice: 39445.00, pnl: 567.30, status: "closed", openedAt: "2025-01-15T09:15:00.000Z" },
  { id: "trade-45", symbol: "ES", side: "sell", quantity: 3, entryPrice: 5261.80, pnl: 178.45, status: "closed", openedAt: "2025-01-15T06:30:00.000Z" },
  { id: "trade-46", symbol: "NQ", side: "buy", quantity: 1, entryPrice: 18665.50, pnl: -412.60, status: "closed", openedAt: "2025-01-15T03:45:00.000Z" },
  { id: "trade-47", symbol: "RTY", side: "sell", quantity: 3, entryPrice: 2073.90, pnl: 56.20, status: "closed", openedAt: "2025-01-15T01:00:00.000Z" },
  { id: "trade-48", symbol: "YM", side: "buy", quantity: 2, entryPrice: 39210.75, pnl: 389.15, status: "closed", openedAt: "2025-01-14T22:15:00.000Z" },
  { id: "trade-49", symbol: "ES", side: "buy", quantity: 2, entryPrice: 5235.25, pnl: -234.70, status: "closed", openedAt: "2025-01-14T19:30:00.000Z" },
  { id: "trade-50", symbol: "NQ", side: "sell", quantity: 4, entryPrice: 18780.25, pnl: 712.40, status: "closed", openedAt: "2025-01-14T16:45:00.000Z" },
  { id: "trade-51", symbol: "RTY", side: "buy", quantity: 1, entryPrice: 2060.45, pnl: 145.80, status: "closed", openedAt: "2025-01-14T14:00:00.000Z" },
  { id: "trade-52", symbol: "YM", side: "sell", quantity: 2, entryPrice: 39330.00, pnl: -289.60, status: "closed", openedAt: "2025-01-14T11:15:00.000Z" },
  { id: "trade-53", symbol: "ES", side: "sell", quantity: 1, entryPrice: 5298.70, pnl: 423.50, status: "closed", openedAt: "2025-01-14T08:30:00.000Z" },
  { id: "trade-54", symbol: "NQ", side: "buy", quantity: 2, entryPrice: 18545.50, pnl: -67.85, status: "closed", openedAt: "2025-01-14T05:45:00.000Z" },
  { id: "trade-55", symbol: "RTY", side: "sell", quantity: 2, entryPrice: 2088.20, pnl: 312.40, status: "closed", openedAt: "2025-01-14T03:00:00.000Z" },
  { id: "trade-56", symbol: "YM", side: "buy", quantity: 3, entryPrice: 39075.50, pnl: 198.75, status: "closed", openedAt: "2025-01-14T00:15:00.000Z" },
  { id: "trade-57", symbol: "ES", side: "buy", quantity: 2, entryPrice: 5252.90, pnl: -156.30, status: "closed", openedAt: "2025-01-13T21:30:00.000Z" },
  { id: "trade-58", symbol: "NQ", side: "sell", quantity: 1, entryPrice: 18860.75, pnl: 278.90, status: "closed", openedAt: "2025-01-13T18:45:00.000Z" },
  { id: "trade-59", symbol: "RTY", side: "buy", quantity: 1, entryPrice: 2057.35, pnl: -45.20, status: "closed", openedAt: "2025-01-13T15:00:00.000Z" },
  { id: "trade-60", symbol: "YM", side: "sell", quantity: 2, entryPrice: 39290.25, pnl: 534.60, status: "closed", openedAt: "2025-01-13T12:15:00.000Z" },
];

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
                setCurrentPage(1);
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
                setCurrentPage(1);
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
                setCurrentPage(1);
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
