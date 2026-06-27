"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Plus, Trash2 } from "lucide-react";
import type { CreateCopyGroupInput, MemberRiskSettings } from "@/lib/validations/copy-group";

interface AccountOption {
  id: string;
  name: string;
  platform: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCopyGroupInput) => void;
  accounts: AccountOption[];
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  accounts,
}: CreateGroupDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [masterAccountId, setMasterAccountId] = useState("");
  const [members, setMembers] = useState<MemberRiskSettings[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setMasterAccountId("");
    setMembers([]);
    setErrors({});
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Group name is required";
    if (name.length > 100) newErrors.name = "Name must be 100 characters or less";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!masterAccountId) newErrors.master = "Please select a master account";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (members.length === 0) newErrors.members = "Add at least one follower account";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      masterAccountId,
      members,
    });
    handleClose(false);
  };

  const addMember = (accountId: string) => {
    if (members.some((m) => m.accountId === accountId)) return;
    setMembers((prev) => [
      ...prev,
      {
        accountId,
        riskMultiplier: 1.0,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
      },
    ]);
  };

  const removeMember = (accountId: string) => {
    setMembers((prev) => prev.filter((m) => m.accountId !== accountId));
  };

  const updateMember = (
    accountId: string,
    field: keyof MemberRiskSettings,
    value: number | boolean
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.accountId === accountId ? { ...m, [field]: value } : m))
    );
  };

  const availableFollowers = accounts.filter(
    (acc) => acc.id !== masterAccountId && !members.some((m) => m.accountId === acc.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            Create Copy Group - Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="group-name">
                Group Name
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., ES Scalping Group"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="group-description">
                Description (optional)
              </label>
              <Input
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this copy group"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select the master account whose trades will be copied to followers.
            </p>
            {errors.master && (
              <p className="text-sm text-destructive">{errors.master}</p>
            )}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                    masterAccountId === account.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setMasterAccountId(account.id)}
                >
                  <div className="flex items-center gap-2">
                    {masterAccountId === account.id && (
                      <Crown className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-medium">{account.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {account.platform}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Add follower accounts and configure their risk settings.
            </p>
            {errors.members && (
              <p className="text-sm text-destructive">{errors.members}</p>
            )}

            {/* Current members */}
            {members.length > 0 && (
              <div className="space-y-3">
                {members.map((member) => {
                  const account = accounts.find(
                    (a) => a.id === member.accountId
                  );
                  return (
                    <div
                      key={member.accountId}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {account?.name || member.accountId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeMember(member.accountId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Multiplier
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="3.0"
                            value={member.riskMultiplier}
                            onChange={(e) =>
                              updateMember(
                                member.accountId,
                                "riskMultiplier",
                                parseFloat(e.target.value) || 0.1
                              )
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
                            value={member.maxLots}
                            onChange={(e) =>
                              updateMember(
                                member.accountId,
                                "maxLots",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Max Daily Loss
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100000"
                            value={member.maxDailyLoss}
                            onChange={(e) =>
                              updateMember(
                                member.accountId,
                                "maxDailyLoss",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add follower */}
            {availableFollowers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Available accounts
                </p>
                {availableFollowers.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{account.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {account.platform}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => addMember(account.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Create Group</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
