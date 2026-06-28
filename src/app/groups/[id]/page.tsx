"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Crown, Settings, Plus, Check, X, TrendingUp, BarChart3, Target, Percent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type MemberRiskData } from "@/components/groups/member-risk-settings";
import { MemberTable } from "@/components/groups/member-table";
import {
  CopyActivityFeed,
  type CopyActivityEvent,
} from "@/components/groups/copy-activity-feed";
import { DailyPnlChart } from "@/components/metrics/daily-pnl-chart";
import { formatCurrency } from "@/lib/utils";
import { TradingPlatform } from "@/lib/trading/types";

// Sample data for group detail
const sampleGroup = {
  id: "g1",
  name: "ES Scalping Group",
  description:
    "Copies ES micro scalp trades from master to all funded accounts",
  isActive: true,
  masterAccount: {
    id: "1",
    name: "Apex Funded 50K",
    platform: TradingPlatform.TRADOVATE,
    status: "active" as const,
  },
  createdAt: "2024-01-10T00:00:00Z",
};

const sampleMembers: MemberRiskData[] = [
  {
    id: "m1",
    accountId: "2",
    accountName: "TopStep 150K",
    accountPlatform: "Tradovate",
    riskMultiplier: 1.5,
    maxLots: 15,
    maxDailyLoss: 2000,
    maxDailyProfit: 5000,
    isActive: true,
  },
  {
    id: "m2",
    accountId: "3",
    accountName: "My NinjaTrader Eval",
    accountPlatform: "NinjaTrader",
    riskMultiplier: 0.5,
    maxLots: 5,
    maxDailyLoss: 500,
    maxDailyProfit: 2000,
    isActive: true,
  },
  {
    id: "m3",
    accountId: "4",
    accountName: "Rithmic Demo",
    accountPlatform: "Rithmic",
    riskMultiplier: 1.0,
    maxLots: 10,
    maxDailyLoss: 1000,
    maxDailyProfit: 3000,
    isActive: false,
  },
];

const sampleAvailableAccounts = [
  { id: "5", name: "Apex 100K Eval", platform: "Tradovate" },
  { id: "6", name: "TopStep 50K", platform: "Tradovate" },
];

// Group daily PnL mock data (15 days, sum of all followers' PnL)
const groupDailyPnl = [
  { date: "2024-01-01", pnl: 325.50 },
  { date: "2024-01-02", pnl: -125.00 },
  { date: "2024-01-03", pnl: 450.75 },
  { date: "2024-01-04", pnl: 180.25 },
  { date: "2024-01-05", pnl: -275.50 },
  { date: "2024-01-08", pnl: 520.00 },
  { date: "2024-01-09", pnl: -90.75 },
  { date: "2024-01-10", pnl: 375.25 },
  { date: "2024-01-11", pnl: 245.50 },
  { date: "2024-01-12", pnl: -180.00 },
  { date: "2024-01-15", pnl: 425.50 },
  { date: "2024-01-16", pnl: 310.75 },
  { date: "2024-01-17", pnl: -150.25 },
  { date: "2024-01-18", pnl: 290.00 },
  { date: "2024-01-19", pnl: 185.50 },
];

const sampleActivity: CopyActivityEvent[] = [
  {
    id: "e1",
    masterAccountName: "Apex Funded 50K",
    symbol: "ESZ4",
    side: "buy",
    quantity: 2,
    followerResults: [
      { accountName: "TopStep 150K", adjustedQuantity: 3, success: true },
      { accountName: "My NinjaTrader Eval", adjustedQuantity: 1, success: true },
    ],
    timestamp: new Date().toISOString(),
  },
  {
    id: "e2",
    masterAccountName: "Apex Funded 50K",
    symbol: "NQZ4",
    side: "sell",
    quantity: 1,
    followerResults: [
      { accountName: "TopStep 150K", adjustedQuantity: 1, success: true },
      {
        accountName: "My NinjaTrader Eval",
        adjustedQuantity: 0,
        success: false,
        reason: "Daily loss limit reached",
      },
    ],
    timestamp: "2024-01-15T13:45:00Z",
  },
  {
    id: "e3",
    masterAccountName: "Apex Funded 50K",
    symbol: "ESZ4",
    side: "buy",
    quantity: 4,
    followerResults: [
      { accountName: "TopStep 150K", adjustedQuantity: 6, success: true },
      { accountName: "My NinjaTrader Eval", adjustedQuantity: 2, success: true },
    ],
    timestamp: "2024-01-15T10:30:00Z",
  },
];

const platformLabels: Record<string, string> = {
  [TradingPlatform.TRADOVATE]: "Tradovate",
  [TradingPlatform.NINJATRADER]: "NinjaTrader",
  [TradingPlatform.RITHMIC]: "Rithmic",
};

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState({ ...sampleGroup, id: groupId || sampleGroup.id });
  const [members, setMembers] = useState<MemberRiskData[]>(sampleMembers);
  const [activity] = useState<CopyActivityEvent[]>(sampleActivity);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  // Edit group form state
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description || "");

  const handleToggleGroup = () => {
    const wasActive = group.isActive;
    setGroup((prev) => ({ ...prev, isActive: !prev.isActive }));
    toast.success(wasActive ? "Group deactivated" : "Group activated");
  };

  const handleSaveMember = (
    memberId: string,
    data: Partial<MemberRiskData>
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...data } : m))
    );
    toast.success("Member settings saved");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Member removed");
  };

  const handleEditGroup = () => {
    setEditName(group.name);
    setEditDescription(group.description || "");
    setEditDialogOpen(true);
  };

  const handleSaveGroup = () => {
    setGroup((prev) => ({
      ...prev,
      name: editName.trim(),
      description: editDescription.trim() || prev.description,
    }));
    setEditDialogOpen(false);
    toast.success("Group updated");
  };

  const handleAddMember = (accountId: string, accountName: string, accountPlatform: string) => {
    const newMember: MemberRiskData = {
      id: `m-${Date.now()}`,
      accountId,
      accountName,
      accountPlatform,
      riskMultiplier: 1.0,
      maxLots: 10,
      maxDailyLoss: 1000,
      maxDailyProfit: 3000,
      isActive: true,
    };
    setMembers((prev) => [...prev, newMember]);
    setAddMemberDialogOpen(false);
    toast.success("Member added");
  };

  const activeMembers = members.filter((m) => m.isActive).length;
  const inactiveMembers = members.filter((m) => !m.isActive).length;

  // Derive stats from mock data
  const totalPnl = groupDailyPnl.reduce((sum, d) => sum + d.pnl, 0);
  const avgRiskMultiplier = members.length > 0
    ? members.reduce((sum, m) => sum + m.riskMultiplier, 0) / members.length
    : 0;
  const winningDays = groupDailyPnl.filter((d) => d.pnl > 0).length;
  const winRate = groupDailyPnl.length > 0
    ? Math.round((winningDays / groupDailyPnl.length) * 100)
    : 0;
  // Trades today is static since there's no individual trades data
  const tradesToday = 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {group.name}
              </h2>
              <Badge variant={group.isActive ? "default" : "secondary"}>
                {group.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {group.isActive ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={group.isActive}
              onCheckedChange={handleToggleGroup}
              aria-label="Toggle group"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleEditGroup}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Group
          </Button>
        </div>
      </div>

      {/* Master Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Crown className="h-4 w-4 text-amber-500" />
            Master Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold">
                {group.masterAccount.name}
              </span>
              <Badge variant="outline">
                {platformLabels[group.masterAccount.platform] ||
                  group.masterAccount.platform}
              </Badge>
              <Badge
                variant={
                  group.masterAccount.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {group.masterAccount.status}
              </Badge>
            </div>
            <Link href={`/accounts/${group.masterAccount.id}`}>
              <Button variant="link" size="sm">
                View Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Group Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-muted-foreground">Total Followers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{activeMembers}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{inactiveMembers}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(totalPnl)}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total PnL</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{tradesToday}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total Trades Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-5 w-5 text-orange-500" />
                <p className="text-2xl font-bold">{avgRiskMultiplier.toFixed(1)}x</p>
              </div>
              <p className="text-sm text-muted-foreground">Avg Risk Multiplier</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Percent className="h-5 w-5 text-purple-500" />
                <p className="text-2xl font-bold">{winRate}%</p>
              </div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Daily PnL */}
      <Card>
        <CardHeader>
          <CardTitle>Group Daily PnL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="text-center rounded-lg border p-3">
              <p className={`text-lg font-bold ${groupDailyPnl[groupDailyPnl.length - 1]?.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(groupDailyPnl[groupDailyPnl.length - 1]?.pnl ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Today&apos;s PnL</p>
            </div>
            <div className="text-center rounded-lg border p-3">
              <p className={`text-lg font-bold ${groupDailyPnl.slice(-5).reduce((s, d) => s + d.pnl, 0) >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(groupDailyPnl.slice(-5).reduce((s, d) => s + d.pnl, 0))}</p>
              <p className="text-xs text-muted-foreground">This Week&apos;s PnL</p>
            </div>
            <div className="text-center rounded-lg border p-3">
              <p className={`text-lg font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(totalPnl)}</p>
              <p className="text-xs text-muted-foreground">This Month&apos;s PnL</p>
            </div>
          </div>
          <DailyPnlChart data={groupDailyPnl} />
        </CardContent>
      </Card>

      {/* Followers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Follower Accounts ({members.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => setAddMemberDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No follower accounts. Add accounts to start copying trades.
              </p>
              <Button className="mt-4" size="sm" onClick={() => setAddMemberDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <MemberTable
            members={members}
            onSave={handleSaveMember}
            onRemove={handleRemoveMember}
          />
        )}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Copy Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyActivityFeed events={activity} />
        </CardContent>
      </Card>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-group-name">
                Group Name
              </label>
              <Input
                id="edit-group-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Group name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-group-description">
                Description
              </label>
              <Input
                id="edit-group-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={!editName.trim()}>
              <Check className="mr-1 h-3 w-3" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Follower Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Select an account to add as a follower. You can configure risk settings after adding.
            </p>
            {sampleAvailableAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available accounts to add.
              </p>
            ) : (
              <div className="space-y-2">
                {sampleAvailableAccounts
                  .filter((acc) => !members.some((m) => m.accountId === acc.id))
                  .map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{account.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {account.platform}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => handleAddMember(account.id, account.name, account.platform)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
