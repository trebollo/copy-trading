"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, subMonths, subYears, startOfMonth, endOfMonth } from "date-fns";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AddTransactionDialog,
  TransactionFormData,
  TransactionType,
  TransactionCategory,
} from "./add-transaction-dialog";
import { isDemoMode } from "@/lib/demo-mode";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
}

const initialTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-01-01",
    description: "TradingView Pro+",
    amount: 59.95,
    type: "expense",
    category: "Data Subscription",
  },
  {
    id: "2",
    date: "2024-01-15",
    description: "Apex Trader Funding - Monthly Fee",
    amount: 150,
    type: "expense",
    category: "Funded Account Fee",
  },
  {
    id: "3",
    date: "2024-01-15",
    description: "TopStep Monthly Fee",
    amount: 165,
    type: "expense",
    category: "Funded Account Fee",
  },
  {
    id: "4",
    date: "2024-01-25",
    description: "Apex Funded 50K - January Payout",
    amount: 1250,
    type: "payout",
    category: "Payout",
  },
  {
    id: "5",
    date: "2024-02-01",
    description: "NinjaTrader License",
    amount: 99,
    type: "expense",
    category: "Platform Fee",
  },
  {
    id: "6",
    date: "2024-02-01",
    description: "TradingView Pro+",
    amount: 59.95,
    type: "expense",
    category: "Data Subscription",
  },
  {
    id: "7",
    date: "2024-02-01",
    description: "Rithmic Data Feed",
    amount: 35,
    type: "expense",
    category: "Data Subscription",
  },
  {
    id: "8",
    date: "2024-02-15",
    description: "Apex Trader Funding - Monthly Fee",
    amount: 150,
    type: "expense",
    category: "Funded Account Fee",
  },
  {
    id: "9",
    date: "2024-02-20",
    description: "TopStep 150K - February Payout",
    amount: 2100,
    type: "payout",
    category: "Payout",
  },
  {
    id: "10",
    date: "2024-03-01",
    description: "TradingView Pro+",
    amount: 59.95,
    type: "expense",
    category: "Data Subscription",
  },
  {
    id: "11",
    date: "2024-03-15",
    description: "Apex Trader Funding - Monthly Fee",
    amount: 150,
    type: "expense",
    category: "Funded Account Fee",
  },
  {
    id: "12",
    date: "2024-03-15",
    description: "TopStep Monthly Fee",
    amount: 165,
    type: "expense",
    category: "Funded Account Fee",
  },
  {
    id: "13",
    date: "2024-03-28",
    description: "Apex Funded 50K - March Payout",
    amount: 1875,
    type: "payout",
    category: "Payout",
  },
];

const STORAGE_KEY = "finances-transactions";

interface StoredTransactions {
  mode: "demo" | "production";
  data: Transaction[];
}

type PeriodFilter =
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all_time";

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
];

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return isDemoMode() ? initialTransactions : [];
  const currentMode = isDemoMode() ? "demo" : "production";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if stored data has the mode envelope
      if (parsed && typeof parsed === "object" && "mode" in parsed && "data" in parsed) {
        const stored = parsed as StoredTransactions;
        // If mode doesn't match current mode, discard stale data
        if (stored.mode !== currentMode) {
          localStorage.removeItem(STORAGE_KEY);
          return currentMode === "demo" ? initialTransactions : [];
        }
        return stored.data;
      }
      // Legacy format (plain array) - discard if not in demo mode
      if (currentMode !== "demo") {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed as Transaction[];
    }
  } catch {
    // Fallback
  }
  // Only use initialTransactions as fallback in demo mode
  return isDemoMode() ? initialTransactions : [];
}

function getFilteredByPeriod(
  transactions: Transaction[],
  period: PeriodFilter
): Transaction[] {
  const now = new Date();
  let cutoff: Date | null = null;
  switch (period) {
    case "this_month":
      cutoff = startOfMonth(now);
      break;
    case "last_3_months":
      cutoff = subMonths(now, 3);
      break;
    case "last_6_months":
      cutoff = subMonths(now, 6);
      break;
    case "this_year":
      cutoff = subYears(now, 1);
      break;
    default:
      cutoff = null;
  }
  if (!cutoff) return transactions;
  return transactions.filter((t) => new Date(t.date) >= cutoff!);
}

function computeTotals(transactions: Transaction[]) {
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const payouts = transactions
    .filter((t) => t.type === "payout")
    .reduce((sum, t) => sum + t.amount, 0);
  return { expenses, payouts, net: payouts - expenses };
}

export function FinancesPageContent() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(isDemoMode() ? initialTransactions : []);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>("all_time");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setTransactions(loadTransactions());
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      const envelope: StoredTransactions = {
        mode: isDemoMode() ? "demo" : "production",
        data: transactions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [transactions]);

  const periodFilteredTransactions = useMemo(
    () => getFilteredByPeriod(transactions, filterPeriod),
    [transactions, filterPeriod]
  );

  const currentTotals = useMemo(
    () => computeTotals(periodFilteredTransactions),
    [periodFilteredTransactions]
  );

  // Comparison: last month totals for sub-text
  const lastMonthTotals = useMemo(() => {
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    return computeTotals(lastMonthTxns);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...periodFilteredTransactions];
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return filtered;
  }, [periodFilteredTransactions, filterType]);

  const monthlyBreakdown = useMemo(() => {
    const groups: Record<
      string,
      { month: string; expenses: number; payouts: number }
    > = {};

    periodFilteredTransactions.forEach((t) => {
      const monthKey = format(new Date(t.date), "yyyy-MM");
      const monthLabel = format(new Date(t.date), "MMMM yyyy");
      if (!groups[monthKey]) {
        groups[monthKey] = { month: monthLabel, expenses: 0, payouts: 0 };
      }
      if (t.type === "expense") {
        groups[monthKey].expenses += t.amount;
      } else {
        groups[monthKey].payouts += t.amount;
      }
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, value]) => value);
  }, [periodFilteredTransactions]);

  const handleAddTransaction = (data: TransactionFormData) => {
    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id ? { ...t, ...data } : t
        )
      );
      toast.success("Transaction updated successfully");
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...data,
      };
      setTransactions((prev) => [...prev, newTransaction]);
      toast.success("Transaction added successfully");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toast.success("Transaction deleted successfully");
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Period Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterPeriod(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterPeriod === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(currentTotals.expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last month: {formatCurrency(lastMonthTotals.expenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(currentTotals.payouts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last month: {formatCurrency(lastMonthTotals.payouts)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={
            currentTotals.net >= 0
              ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
              : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div
              className={`text-xl font-bold ${
                currentTotals.net >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(currentTotals.net)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last month: {formatCurrency(lastMonthTotals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Type Filter + Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select
            value={filterType}
            onValueChange={(v) =>
              setFilterType(v as "all" | TransactionType)
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="payout">Payouts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Transactions - Mobile: Card list, Desktop: Table */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-xs">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Description</th>
                  <th className="px-3 py-2 text-right font-medium text-xs">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Category</th>
                  <th className="px-3 py-2 text-right font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-2 text-xs">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-3 py-2 text-xs">{transaction.description}</td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span
                        className={
                          transaction.type === "expense"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          transaction.type === "expense"
                            ? "destructive"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {transaction.type === "expense" ? "Expense" : "Payout"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {transaction.category}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-muted-foreground text-xs"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {filteredTransactions.length === 0 && (
              <p className="py-6 text-center text-muted-foreground text-xs">
                No transactions found.
              </p>
            )}
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                    <Badge
                      variant={
                        transaction.type === "expense"
                          ? "destructive"
                          : "default"
                      }
                      className="text-[9px] px-1.5 py-0"
                    >
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      transaction.type === "expense"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium text-xs">Month</th>
                    <th className="px-3 py-2 text-right font-medium text-xs">Expenses</th>
                    <th className="px-3 py-2 text-right font-medium text-xs">Payouts</th>
                    <th className="px-3 py-2 text-right font-medium text-xs">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyBreakdown.map((month) => {
                    const net = month.payouts - month.expenses;
                    return (
                      <tr
                        key={month.month}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-3 py-2 text-xs font-medium">{month.month}</td>
                        <td className="px-3 py-2 text-right text-xs text-red-600 dark:text-red-400">
                          {formatCurrency(month.expenses)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-green-600 dark:text-green-400">
                          {formatCurrency(month.payouts)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right text-xs font-medium ${
                            net >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
              {monthlyBreakdown.map((month) => {
                const net = month.payouts - month.expenses;
                return (
                  <div
                    key={month.month}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-xs font-medium">{month.month}</span>
                    <span
                      className={`text-xs font-semibold ${
                        net >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(net)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Transaction Dialog */}
      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        onSubmit={handleAddTransaction}
        initialData={
          editingTransaction
            ? {
                date: editingTransaction.date,
                description: editingTransaction.description,
                amount: editingTransaction.amount,
                type: editingTransaction.type,
                category: editingTransaction.category,
              }
            : null
        }
        mode={editingTransaction ? "edit" : "add"}
      />
    </div>
  );
}
