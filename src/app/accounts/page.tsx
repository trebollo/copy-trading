"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, RefreshCw, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog";
import type { CreateTradingAccountInput, UpdateTradingAccountInput } from "@/lib/validations/trading-account";
import { TradingPlatform } from "@/lib/trading/types";
import { isDemoMode } from "@/lib/demo-mode";

interface TradingAccountData {
  id: string;
  name: string;
  platform: string;
  accountId: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  balance: number;
  status: string;
  updatedAt: string;
}

type SortField = "name" | "balance" | "status" | "platform" | "updatedAt";
type SortDirection = "asc" | "desc";

// Sample data for demo mode only
const sampleAccounts: TradingAccountData[] = [
  {
    id: "1",
    name: "Apex Funded 50K",
    platform: TradingPlatform.TRADOVATE,
    accountId: "APX-50001",
    balance: 52340.0,
    status: "active",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "TopStep 150K",
    platform: TradingPlatform.TRADOVATE,
    accountId: "TS-150002",
    balance: 148920.5,
    status: "active",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "My NinjaTrader Eval",
    platform: TradingPlatform.NINJATRADER,
    accountId: "NT-EVAL-001",
    balance: 25000.0,
    status: "inactive",
    updatedAt: new Date().toISOString(),
  },
];

export default function AccountsPage() {
  const demo = isDemoMode();

  const [accounts, setAccounts] = useState<TradingAccountData[]>(demo ? sampleAccounts : []);
  const [loading, setLoading] = useState(!demo);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccountData | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  // Fetch accounts from API in production mode
  useEffect(() => {
    if (demo) return;

    async function fetchAccounts() {
      try {
        const res = await fetch("/api/accounts?limit=100");
        if (res.ok) {
          const data = await res.json();
          const fetchedAccounts: TradingAccountData[] = (data.accounts || []).map((acc: Record<string, unknown>) => ({
            id: acc.id as string,
            name: acc.name as string,
            platform: acc.platform as string,
            accountId: acc.accountId as string,
            apiKey: acc.apiKey as string | null | undefined,
            apiSecret: acc.apiSecret as string | null | undefined,
            balance: (acc.balance as number) ?? 0,
            status: acc.status as string,
            updatedAt: acc.updatedAt as string,
          }));
          setAccounts(fetchedAccounts);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [demo]);

  const _handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedAccounts = useMemo(() => {
    let result = [...accounts];

    // Apply filters
    if (filterStatus !== "all") {
      result = result.filter((acc) => acc.status === filterStatus);
    }
    if (filterPlatform !== "all") {
      result = result.filter((acc) => acc.platform === filterPlatform);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "balance":
          comparison = a.balance - b.balance;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "platform":
          comparison = a.platform.localeCompare(b.platform);
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [accounts, sortField, sortDirection, filterStatus, filterPlatform]);

  // Get unique platforms for filter
  const platforms = useMemo(() => {
    const uniquePlatforms = new Set(accounts.map((acc) => acc.platform));
    return Array.from(uniquePlatforms);
  }, [accounts]);

  const handleCreate = async (data: CreateTradingAccountInput) => {
    if (demo) {
      const newAccount: TradingAccountData = {
        id: crypto.randomUUID(),
        name: data.name,
        platform: data.platform,
        accountId: data.accountId,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        balance: 0,
        status: "active",
        updatedAt: new Date().toISOString(),
      };
      setAccounts((prev) => [newAccount, ...prev]);
      return;
    }

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        const newAccount: TradingAccountData = {
          id: created.id,
          name: created.name,
          platform: created.platform,
          accountId: created.accountId,
          apiKey: created.apiKey,
          apiSecret: created.apiSecret,
          balance: created.balance ?? 0,
          status: created.status,
          updatedAt: created.updatedAt,
        };
        setAccounts((prev) => [newAccount, ...prev]);
        toast.success("Account created");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Failed to create account");
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      toast.error("Failed to create account");
    }
  };

  const handleEdit = async (data: UpdateTradingAccountInput) => {
    if (!editingAccount) return;

    if (demo) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === editingAccount.id
            ? { ...acc, ...data, updatedAt: new Date().toISOString() }
            : acc
        )
      );
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === editingAccount.id
              ? {
                  ...acc,
                  name: updated.name ?? acc.name,
                  platform: updated.platform ?? acc.platform,
                  accountId: updated.accountId ?? acc.accountId,
                  status: updated.status ?? acc.status,
                  updatedAt: updated.updatedAt ?? new Date().toISOString(),
                }
              : acc
          )
        );
        toast.success("Account updated");
      } else {
        toast.error("Failed to update account");
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      toast.error("Failed to update account");
    }
  };

  const handleSync = async (id: string) => {
    if (demo) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === id ? { ...acc, updatedAt: new Date().toISOString() } : acc
        )
      );
      toast.success("Account synced");
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${id}/sync`, { method: "POST" });
      if (res.ok) {
        const synced = await res.json();
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === id
              ? { ...acc, balance: synced.balance ?? acc.balance, updatedAt: synced.updatedAt ?? new Date().toISOString() }
              : acc
          )
        );
        toast.success("Account synced");
      } else {
        toast.error("Failed to sync account");
      }
    } catch (error) {
      console.error("Failed to sync account:", error);
      toast.error("Failed to sync account");
    }
  };

  const handleSyncAll = async () => {
    if (demo) {
      setAccounts((prev) =>
        prev.map((acc) => ({ ...acc, updatedAt: new Date().toISOString() }))
      );
      toast.success("All accounts synced");
      return;
    }

    for (const account of accounts) {
      await handleSync(account.id);
    }
    toast.success("All accounts synced");
  };

  const handleDelete = async (id: string) => {
    if (demo) {
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
        toast.success("Account deleted");
      } else {
        toast.error("Failed to delete account");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account");
    }
  };

  const openEdit = (id: string) => {
    const account = accounts.find((acc) => acc.id === id);
    if (account) {
      setEditingAccount(account);
      setEditDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Trading Accounts</h2>
            <p className="text-muted-foreground">Manage your funded trading accounts across different platforms.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading accounts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Trading Accounts
          </h2>
          <p className="text-muted-foreground">
            Manage your funded trading accounts across different platforms.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Filters and Sorting Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by platform"
          >
            <option value="all">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort:</span>
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-") as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(dir);
            }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Sort accounts"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="balance-desc">Balance (High-Low)</option>
            <option value="balance-asc">Balance (Low-High)</option>
            <option value="platform-asc">Platform (A-Z)</option>
            <option value="platform-desc">Platform (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="updatedAt-asc">Oldest Updated</option>
          </select>
        </div>
      </div>

      {filteredAndSortedAccounts.length === 0 && accounts.length > 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No accounts match filters</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filter criteria.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setFilterStatus("all");
              setFilterPlatform("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No accounts yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first trading account to get started.
          </p>
          <Button
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onSync={handleSync}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />

      <EditAccountDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEdit}
        account={editingAccount}
      />
    </div>
  );
}
