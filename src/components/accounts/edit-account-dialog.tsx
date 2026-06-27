"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradingPlatform } from "@/lib/trading/types";
import { updateTradingAccountSchema } from "@/lib/validations/trading-account";

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof updateTradingAccountSchema>) => void;
  account: {
    id: string;
    name: string;
    platform: string;
    accountId: string;
    apiKey?: string | null;
    apiSecret?: string | null;
    status: string;
  } | null;
}

export function EditAccountDialog({
  open,
  onOpenChange,
  onSubmit,
  account,
}: EditAccountDialogProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setPlatform(account.platform);
      setAccountId(account.accountId);
      setApiKey(account.apiKey || "");
      setApiSecret(account.apiSecret || "");
      setStatus(account.status);
      setErrors({});
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      platform: platform as TradingPlatform,
      accountId,
      apiKey: apiKey || undefined,
      apiSecret: apiSecret || undefined,
      status: status as "active" | "inactive" | "error",
    };

    const validation = updateTradingAccountSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value) formattedErrors[key] = value;
      }
      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(validation.data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Trading Account</DialogTitle>
          <DialogDescription>
            Update your trading account settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Account Name
            </label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-platform" className="text-sm font-medium">
              Platform
            </label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TradingPlatform.TRADOVATE}>
                  Tradovate
                </SelectItem>
                <SelectItem value={TradingPlatform.NINJATRADER}>
                  NinjaTrader
                </SelectItem>
                <SelectItem value={TradingPlatform.RITHMIC}>
                  Rithmic
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-destructive">{errors.platform[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-accountId" className="text-sm font-medium">
              Account ID
            </label>
            <Input
              id="edit-accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
            {errors.accountId && (
              <p className="text-sm text-destructive">
                {errors.accountId[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-apiKey" className="text-sm font-medium">
              API Key
            </label>
            <Input
              id="edit-apiKey"
              type="password"
              placeholder="Leave blank to keep current"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-apiSecret" className="text-sm font-medium">
              API Secret
            </label>
            <Input
              id="edit-apiSecret"
              type="password"
              placeholder="Leave blank to keep current"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />
            {errors.apiSecret && (
              <p className="text-sm text-destructive">
                {errors.apiSecret[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-status" className="text-sm font-medium">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status[0]}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
