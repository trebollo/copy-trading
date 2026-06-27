"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupCard, type GroupCardData } from "@/components/groups/group-card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import type { CreateCopyGroupInput } from "@/lib/validations/copy-group";

// Sample accounts for group creation dialog
const sampleAccounts = [
  { id: "1", name: "Apex Funded 50K", platform: "Tradovate" },
  { id: "2", name: "TopStep 150K", platform: "Tradovate" },
  { id: "3", name: "My NinjaTrader Eval", platform: "NinjaTrader" },
  { id: "4", name: "Rithmic Demo", platform: "Rithmic" },
];

// Sample groups for initial render
const sampleGroups: GroupCardData[] = [
  {
    id: "g1",
    name: "ES Scalping Group",
    description: "Copies ES micro scalp trades from master to all funded accounts",
    isActive: true,
    masterAccountName: "Apex Funded 50K",
    masterAccountPlatform: "Tradovate",
    memberCount: 2,
    lastActivityAt: new Date().toISOString(),
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "g2",
    name: "NQ Swing Trades",
    description: "Swing trading NQ futures with conservative risk settings",
    isActive: true,
    masterAccountName: "TopStep 150K",
    masterAccountPlatform: "Tradovate",
    memberCount: 1,
    lastActivityAt: "2024-01-14T16:30:00Z",
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "g3",
    name: "Paused Group",
    description: null,
    isActive: false,
    masterAccountName: "My NinjaTrader Eval",
    masterAccountPlatform: "NinjaTrader",
    memberCount: 3,
    lastActivityAt: "2024-01-08T09:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupCardData[]>(sampleGroups);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreate = (data: CreateCopyGroupInput) => {
    const masterAccount = sampleAccounts.find(
      (acc) => acc.id === data.masterAccountId
    );
    const newGroup: GroupCardData = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || null,
      isActive: true,
      masterAccountName: masterAccount?.name || "Unknown",
      masterAccountPlatform: masterAccount?.platform || "Unknown",
      memberCount: data.members.length,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [newGroup, ...prev]);
  };

  const handleToggle = (id: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === id ? { ...group, isActive: !group.isActive } : group
      )
    );
  };

  const handleDelete = (id: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Copy Groups</h2>
          <p className="text-muted-foreground">
            Create and manage copy trading groups with master and follower accounts.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No copy groups yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first copy group to start replicating trades.
          </p>
          <Button
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        accounts={sampleAccounts}
      />
    </div>
  );
}
