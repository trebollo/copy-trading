"use client";

import { MoreHorizontal, RefreshCw, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TradingPlatform } from "@/lib/trading/types";
import Link from "next/link";

export interface AccountCardProps {
  account: {
    id: string;
    name: string;
    platform: string;
    accountId: string;
    balance: number;
    status: string;
    updatedAt: string;
  };
  onSync?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const platformLabels: Record<string, string> = {
  [TradingPlatform.TRADOVATE]: "Tradovate",
  [TradingPlatform.NINJATRADER]: "NinjaTrader",
  [TradingPlatform.RITHMIC]: "Rithmic",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  error: "destructive",
  deleted: "outline",
};

export function AccountCard({ account, onSync, onEdit, onDelete }: AccountCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Link href={`/accounts/${account.id}`}>
            <CardTitle className="text-base font-semibold hover:text-primary transition-colors cursor-pointer">
              {account.name}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {platformLabels[account.platform] || account.platform}
            </Badge>
            <Badge variant={statusVariants[account.status] || "outline"}>
              {account.status}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSync?.(account.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(account.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(account.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-lg font-bold">
              {formatCurrency(account.balance)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <span className="text-sm font-mono">{account.accountId}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">
              {formatDate(account.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
