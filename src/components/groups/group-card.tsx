"use client";

import { MoreHorizontal, Crown, Users, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export interface GroupCardData {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  masterAccountName: string;
  masterAccountPlatform: string;
  memberCount: number;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface GroupCardProps {
  group: GroupCardData;
  onToggle?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function GroupCard({ group, onToggle, onEdit, onDelete }: GroupCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Link href={`/groups/${group.id}`}>
            <CardTitle className="text-base font-semibold hover:text-primary transition-colors cursor-pointer">
              {group.name}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={group.isActive ? "default" : "secondary"}>
              {group.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={group.isActive}
            onCheckedChange={() => onToggle?.(group.id)}
            aria-label={`Toggle group ${group.name}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(group.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(group.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{group.masterAccountName}</span>
            <Badge variant="outline" className="text-xs">
              {group.masterAccountPlatform}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {group.memberCount} follower{group.memberCount !== 1 ? "s" : ""}
            </span>
          </div>
          {group.lastActivityAt && (
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Last activity</span>
              <span>{formatDate(group.lastActivityAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
