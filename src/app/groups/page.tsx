"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, ArrowUpDown, Filter, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { GroupCard, type GroupCardData } from "@/components/groups/group-card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import type { CreateCopyGroupInput } from "@/lib/validations/copy-group";
import { isDemoMode } from "@/lib/demo-mode";

type SortField = "name" | "memberCount" | "status" | "lastActivityAt" | "createdAt";
type SortDirection = "asc" | "desc";

// Sample accounts for group creation dialog (demo mode)
const sampleAccountsDemo = [
  { id: "1", name: "Apex Funded 50K", platform: "Tradovate" },
  { id: "2", name: "TopStep 150K", platform: "Tradovate" },
  { id: "3", name: "My NinjaTrader Eval", platform: "NinjaTrader" },
  { id: "4", name: "Rithmic Demo", platform: "Rithmic" },
];

// Sample groups for demo mode
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
    dailyPnl: 425.50,
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
    dailyPnl: -87.25,
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
    dailyPnl: 0,
  },
];

export default function GroupsPage() {
  const demo = isDemoMode();

  const [groups, setGroups] = useState<GroupCardData[]>(demo ? sampleGroups : []);
  const [accounts, setAccounts] = useState<{ id: string; name: string; platform: string }[]>(
    demo ? sampleAccountsDemo : []
  );
  const [loading, setLoading] = useState(!demo);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupCardData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch groups and accounts from API in production mode
  useEffect(() => {
    if (demo) return;

    async function fetchData() {
      try {
        const [groupsRes, accountsRes] = await Promise.all([
          fetch("/api/groups?limit=100"),
          fetch("/api/accounts?limit=100"),
        ]);

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          const fetchedGroups: GroupCardData[] = (data.groups || []).map((g: Record<string, unknown>) => ({
            id: g.id as string,
            name: g.name as string,
            description: (g.description as string) || null,
            isActive: g.isActive as boolean,
            masterAccountName: (g.masterAccountName as string) || "Unknown",
            masterAccountPlatform: (g.masterAccountPlatform as string) || "Unknown",
            memberCount: (g.memberCount as number) || 0,
            lastActivityAt: (g.lastActivityAt as string) || null,
            createdAt: g.createdAt as string,
            dailyPnl: (g.dailyPnl as number) || 0,
          }));
          setGroups(fetchedGroups);
        }

        if (accountsRes.ok) {
          const data = await accountsRes.json();
          const fetchedAccounts = (data.accounts || []).map((acc: Record<string, unknown>) => ({
            id: acc.id as string,
            name: acc.name as string,
            platform: acc.platform as string,
          }));
          setAccounts(fetchedAccounts);
        }
      } catch (error) {
        console.error("Failed to fetch groups data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [demo]);

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

  const handleCreate = async (data: CreateCopyGroupInput) => {
    if (demo) {
      const masterAccount = accounts.find(
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
      return;
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        const masterAccount = accounts.find(
          (acc) => acc.id === data.masterAccountId
        );
        const newGroup: GroupCardData = {
          id: created.id,
          name: created.name,
          description: created.description || null,
          isActive: created.isActive ?? true,
          masterAccountName: masterAccount?.name || "Unknown",
          masterAccountPlatform: masterAccount?.platform || "Unknown",
          memberCount: data.members.length,
          lastActivityAt: null,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setGroups((prev) => [newGroup, ...prev]);
        toast.success("Group created");
      } else {
        toast.error("Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    }
  };

  const handleToggle = async (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;

    if (demo) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, isActive: !g.isActive } : g
        )
      );
      toast.success(group.isActive ? "Group deactivated" : "Group activated");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !group.isActive }),
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === id ? { ...g, isActive: !g.isActive } : g
          )
        );
        toast.success(group.isActive ? "Group deactivated" : "Group activated");
      } else {
        toast.error("Failed to toggle group");
      }
    } catch (error) {
      console.error("Failed to toggle group:", error);
      toast.error("Failed to toggle group");
    }
  };

  const handleDelete = async (id: string) => {
    if (demo) {
      setGroups((prev) => prev.filter((group) => group.id !== id));
      toast.success("Group deleted");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) => prev.filter((group) => group.id !== id));
        toast.success("Group deleted");
      } else {
        toast.error("Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    }
  };

  const handleEdit = (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (group) {
      setEditingGroup(group);
      setEditName(group.name);
      setEditDescription(group.description || "");
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim()) return;

    if (demo) {
      setGroups((prev) =>
        prev.map((group) =>
          group.id === editingGroup.id
            ? { ...group, name: editName.trim(), description: editDescription.trim() || null }
            : group
        )
      );
      setEditDialogOpen(false);
      setEditingGroup(null);
      toast.success("Group updated");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null }),
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((group) =>
            group.id === editingGroup.id
              ? { ...group, name: editName.trim(), description: editDescription.trim() || null }
              : group
          )
        );
        setEditDialogOpen(false);
        setEditingGroup(null);
        toast.success("Group updated");
      } else {
        toast.error("Failed to update group");
      }
    } catch (error) {
      console.error("Failed to update group:", error);
      toast.error("Failed to update group");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Copy Groups</h2>
            <p className="text-muted-foreground">
              Create and manage copy trading groups with master and follower accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading groups...
        </div>
      </div>
    );
  }

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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        accounts={accounts}
      />

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
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              <Check className="mr-1 h-3 w-3" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
