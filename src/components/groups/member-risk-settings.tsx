"use client";

import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface MemberRiskData {
  id: string;
  accountId: string;
  accountName: string;
  accountPlatform: string;
  riskMultiplier: number;
  maxLots: number;
  maxDailyLoss: number;
  maxDailyProfit: number;
  isActive: boolean;
  isMaster?: boolean;
}

interface MemberRiskSettingsProps {
  member: MemberRiskData;
  onSave: (memberId: string, data: Partial<MemberRiskData>) => void;
  onRemove?: (memberId: string) => void;
}

export function MemberRiskSettings({
  member,
  onSave,
  onRemove,
}: MemberRiskSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [riskMultiplier, setRiskMultiplier] = useState(member.riskMultiplier);
  const [maxLots, setMaxLots] = useState(member.maxLots);
  const [maxDailyLoss, setMaxDailyLoss] = useState(member.maxDailyLoss);
  const [maxDailyProfit, setMaxDailyProfit] = useState(member.maxDailyProfit);

  const handleSave = () => {
    onSave(member.id, { riskMultiplier, maxLots, maxDailyLoss, maxDailyProfit });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setRiskMultiplier(member.riskMultiplier);
    setMaxLots(member.maxLots);
    setMaxDailyLoss(member.maxDailyLoss);
    setMaxDailyProfit(member.maxDailyProfit);
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    onSave(member.id, { isActive: !member.isActive });
  };

  return (
    <Card className={!member.isActive ? "opacity-60" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {member.accountName}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {member.accountPlatform}
            </Badge>
            <Badge variant={member.isActive ? "default" : "secondary"} className="text-xs">
              {member.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={member.isActive}
              onCheckedChange={handleToggleActive}
              aria-label={`Toggle ${member.accountName}`}
            />
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setIsEditing(true)}
                aria-label={`Edit settings for ${member.accountName}`}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => onRemove(member.id)}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs text-muted-foreground">
                  Risk Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3.0"
                  value={riskMultiplier}
                  onChange={(e) =>
                    setRiskMultiplier(parseFloat(e.target.value) || 0.1)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Max Lots
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxLots}
                  onChange={(e) =>
                    setMaxLots(parseInt(e.target.value) || 1)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Max Daily Loss ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100000"
                  value={maxDailyLoss}
                  onChange={(e) =>
                    setMaxDailyLoss(parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Max Daily Profit ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100000"
                  value={maxDailyProfit}
                  onChange={(e) =>
                    setMaxDailyProfit(parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={handleCancel}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
              <Button size="sm" className="h-7" onClick={handleSave}>
                <Check className="mr-1 h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 cursor-pointer rounded p-1 -m-1 hover:bg-muted/50 transition-colors"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsEditing(true);
            }}
            aria-label={`Edit risk settings for ${member.accountName}`}
          >
            <div>
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-sm font-medium">{member.riskMultiplier}x</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Lots</p>
              <p className="text-sm font-medium">{member.maxLots}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Daily Loss</p>
              <p className="text-sm font-medium">${member.maxDailyLoss}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Daily Profit</p>
              <p className="text-sm font-medium">${member.maxDailyProfit}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
