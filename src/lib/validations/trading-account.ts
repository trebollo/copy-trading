import { z } from "zod";
import { TradingPlatform } from "@/lib/trading/types";

export const createTradingAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or less"),
  platform: z.nativeEnum(TradingPlatform, {
    errorMap: () => ({ message: "Please select a valid trading platform" }),
  }),
  accountId: z
    .string()
    .min(1, "Account ID is required")
    .max(50, "Account ID must be 50 characters or less"),
  apiKey: z
    .string()
    .max(500, "API key must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  apiSecret: z
    .string()
    .max(500, "API secret must be 500 characters or less")
    .optional()
    .or(z.literal("")),
});

export const updateTradingAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or less")
    .optional(),
  platform: z
    .nativeEnum(TradingPlatform, {
      errorMap: () => ({ message: "Please select a valid trading platform" }),
    })
    .optional(),
  accountId: z
    .string()
    .min(1, "Account ID is required")
    .max(50, "Account ID must be 50 characters or less")
    .optional(),
  apiKey: z
    .string()
    .max(500, "API key must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  apiSecret: z
    .string()
    .max(500, "API secret must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive", "error"]).optional(),
});

export type CreateTradingAccountInput = z.infer<typeof createTradingAccountSchema>;
export type UpdateTradingAccountInput = z.infer<typeof updateTradingAccountSchema>;
