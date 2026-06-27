"use client";

import { useState } from "react";
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
import { createTradingAccountSchema } from "@/lib/validations/trading-account";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof createTradingAccountSchema>) => void;
}

const UNSUPPORTED_PLATFORMS = new Set([
  TradingPlatform.NINJATRADER,
  TradingPlatform.RITHMIC,
]);

export function CreateAccountDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAccountDialogProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setPlatform("");
    setAccountId("");
    setApiKey("");
    setApiSecret("");
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      platform: platform as TradingPlatform,
      accountId,
      apiKey: apiKey || undefined,
      apiSecret: apiSecret || undefined,
    };

    const validation = createTradingAccountSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value) formattedErrors[key] = value;
      }
      setErrors(formattedErrors);
      return;
    }

    // Block unsupported platforms
    if (UNSUPPORTED_PLATFORMS.has(validation.data.platform)) {
      setErrors({
        platform: ["This platform is not yet supported. Coming soon!"],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(validation.data);
      resetForm();
      onOpenChange(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Trading Account</DialogTitle>
          <DialogDescription>
            Connect a new trading account from your funding company.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Account Name
            </label>
            <Input
              id="name"
              placeholder="My Tradovate Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="platform" className="text-sm font-medium">
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
                <SelectItem
                  value={TradingPlatform.NINJATRADER}
                  disabled
                >
                  NinjaTrader
                  <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                </SelectItem>
                <SelectItem
                  value={TradingPlatform.RITHMIC}
                  disabled
                >
                  Rithmic
                  <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-destructive">{errors.platform[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="accountId" className="text-sm font-medium">
              Account ID
            </label>
            <Input
              id="accountId"
              placeholder="123456"
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
            <label htmlFor="apiKey" className="text-sm font-medium">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="apiSecret" className="text-sm font-medium">
              API Secret
            </label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="Enter API secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />
            {errors.apiSecret && (
              <p className="text-sm text-destructive">
                {errors.apiSecret[0]}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
