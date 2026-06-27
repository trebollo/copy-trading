"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MemberRiskSettings,
  type MemberRiskData,
} from "@/components/groups/member-risk-settings";
import {
  CopyActivityFeed,
  type CopyActivityEvent,
} from "@/components/groups/copy-activity-feed";
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
    isActive: false,
  },
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
  const [group, setGroup] = useState(sampleGroup);
  const [members, setMembers] = useState<MemberRiskData[]>(sampleMembers);
  const [activity] = useState<CopyActivityEvent[]>(sampleActivity);

  const handleToggleGroup = () => {
    setGroup((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSaveMember = (
    memberId: string,
    data: Partial<MemberRiskData>
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...data } : m))
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

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
          <Button variant="outline" size="sm">
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

      {/* Followers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Follower Accounts ({members.length})
          </h3>
        </div>
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No follower accounts. Add accounts to start copying trades.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <MemberRiskSettings
                key={member.id}
                member={member}
                onSave={handleSaveMember}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
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
    </div>
  );
}
