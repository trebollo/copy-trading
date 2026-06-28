"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
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

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return initialTransactions;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Transaction[];
    }
  } catch {
    // Fallback to initial data
  }
  return initialTransactions;
}

export function FinancesPageContent() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return filtered;
  }, [transactions, filterType]);

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalPayouts = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "payout")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netProfit = totalPayouts - totalExpenses;

  const monthlyBreakdown = useMemo(() => {
    const groups: Record<
      string,
      { month: string; expenses: number; payouts: number }
    > = {};

    transactions.forEach((t) => {
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
  }, [transactions]);

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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPayouts)}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            netProfit >= 0
              ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
              : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netProfit >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <Select
            value={filterType}
            onValueChange={(v) =>
              setFilterType(v as "all" | TransactionType)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="payout">Payout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3">{transaction.description}</td>
                    <td className="px-4 py-3 text-right">
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
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          transaction.type === "expense"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {transaction.type === "expense" ? "Expense" : "Payout"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Month</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Total Expenses
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Total Payouts
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
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
                      <td className="px-4 py-3 font-medium">{month.month}</td>
                      <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                        {formatCurrency(month.expenses)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                        {formatCurrency(month.payouts)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
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
        </CardContent>
      </Card>

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
