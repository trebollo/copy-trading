"use client";

import { useState } from "react";
import { Check, X, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { type MemberRiskData } from "@/components/groups/member-risk-settings";

interface MemberTableProps {
  members: MemberRiskData[];
  onSave: (memberId: string, data: Partial<MemberRiskData>) => void;
  onRemove?: (memberId: string) => void;
}

function MemberTableRow({
  member,
  onSave,
  onRemove,
}: {
  member: MemberRiskData;
  onSave: (memberId: string, data: Partial<MemberRiskData>) => void;
  onRemove?: (memberId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [riskMultiplier, setRiskMultiplier] = useState(member.riskMultiplier);
  const [maxLots, setMaxLots] = useState(member.maxLots);
  const [maxDailyLoss, setMaxDailyLoss] = useState(member.maxDailyLoss);

  const handleSave = () => {
    onSave(member.id, { riskMultiplier, maxLots, maxDailyLoss });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setRiskMultiplier(member.riskMultiplier);
    setMaxLots(member.maxLots);
    setMaxDailyLoss(member.maxDailyLoss);
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    onSave(member.id, { isActive: !member.isActive });
  };

  return (
    <tr className={`border-b text-sm ${!member.isActive ? "opacity-50" : ""}`}>
      <td className="px-3 py-2 font-medium whitespace-nowrap">
        {member.accountName}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Badge variant="outline" className="text-xs">
          {member.accountPlatform}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <Switch
          checked={member.isActive}
          onCheckedChange={handleToggleActive}
          aria-label={`Toggle ${member.accountName}`}
        />
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isEditing ? (
          <Input
            type="number"
            step="0.1"
            min="0.1"
            max="3.0"
            value={riskMultiplier}
            onChange={(e) => setRiskMultiplier(parseFloat(e.target.value) || 0.1)}
            className="h-7 w-20 text-sm"
          />
        ) : (
          <span>{member.riskMultiplier}x</span>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isEditing ? (
          <Input
            type="number"
            min="1"
            max="100"
            value={maxLots}
            onChange={(e) => setMaxLots(parseInt(e.target.value) || 1)}
            className="h-7 w-16 text-sm"
          />
        ) : (
          <span>{member.maxLots}</span>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            max="100000"
            value={maxDailyLoss}
            onChange={(e) => setMaxDailyLoss(parseInt(e.target.value) || 0)}
            className="h-7 w-20 text-sm"
          />
        ) : (
          <span>${member.maxDailyLoss}</span>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCancel}
                aria-label="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                onClick={handleSave}
                aria-label="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
                aria-label={`Edit ${member.accountName}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => onRemove(member.id)}
                  aria-label={`Remove ${member.accountName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function MemberTable({ members, onSave, onRemove }: MemberTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Account
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Platform
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Active
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Risk Multiplier
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Max Lots
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Max Daily Loss
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberTableRow
              key={member.id}
              member={member}
              onSave={onSave}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
