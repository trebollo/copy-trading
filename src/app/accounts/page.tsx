"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog";
import type { CreateTradingAccountInput, UpdateTradingAccountInput } from "@/lib/validations/trading-account";
import { TradingPlatform } from "@/lib/trading/types";

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

// Sample data for initial render (will be replaced by API calls)
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
  const [accounts, setAccounts] = useState<TradingAccountData[]>(sampleAccounts);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccountData | null>(null);

  const handleCreate = (data: CreateTradingAccountInput) => {
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
  };

  const handleEdit = (data: UpdateTradingAccountInput) => {
    if (!editingAccount) return;
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === editingAccount.id
          ? {
              ...acc,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : acc
      )
    );
  };

  const handleSync = (id: string) => {
    // In production, this calls the /api/accounts/[id]/sync endpoint
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, updatedAt: new Date().toISOString() } : acc
      )
    );
  };

  const handleDelete = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const openEdit = (id: string) => {
    const account = accounts.find((acc) => acc.id === id);
    if (account) {
      setEditingAccount(account);
      setEditDialogOpen(true);
    }
  };

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
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
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
          {accounts.map((account) => (
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
