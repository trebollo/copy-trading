"use client";

import { useState, useMemo } from "react";
import { Plus, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupCard, type GroupCardData } from "@/components/groups/group-card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import type { CreateCopyGroupInput } from "@/lib/validations/copy-group";

type SortField = "name" | "memberCount" | "status" | "lastActivityAt" | "createdAt";
type SortDirection = "asc" | "desc";

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

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groups];

    // Apply filters
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      result = result.filter((group) => group.isActive === isActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "memberCount":
          comparison = a.memberCount - b.memberCount;
          break;
        case "status":
          comparison = Number(a.isActive) - Number(b.isActive);
          break;
        case "lastActivityAt": {
          const dateA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const dateB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [groups, sortField, sortDirection, filterStatus]);

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
            aria-label="Sort groups"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="memberCount-desc">Members (Most)</option>
            <option value="memberCount-asc">Members (Least)</option>
            <option value="lastActivityAt-desc">Recent Activity</option>
            <option value="lastActivityAt-asc">Oldest Activity</option>
            <option value="createdAt-desc">Newest Created</option>
            <option value="createdAt-asc">Oldest Created</option>
          </select>
        </div>
      </div>

      {filteredAndSortedGroups.length === 0 && groups.length > 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No groups match filters</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filter criteria.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setFilterStatus("all")}
          >
            Clear Filters
          </Button>
        </div>
      ) : groups.length === 0 ? (
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
          {filteredAndSortedGroups.map((group) => (
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
