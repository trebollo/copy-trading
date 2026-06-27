import { z } from "zod";

export const memberRiskSettingsSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  riskMultiplier: z
    .number()
    .min(0.1, "Risk multiplier must be at least 0.1")
    .max(3.0, "Risk multiplier must be at most 3.0"),
  maxLots: z
    .number()
    .min(1, "Max lots must be at least 1")
    .max(100, "Max lots must be at most 100"),
  maxDailyLoss: z
    .number()
    .min(0, "Max daily loss must be non-negative")
    .max(100000, "Max daily loss must be at most $100,000"),
  isActive: z.boolean().default(true),
});

export const createCopyGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  masterAccountId: z.string().min(1, "Master account is required"),
  members: z
    .array(memberRiskSettingsSchema)
    .min(1, "At least one follower account is required"),
});

export const updateCopyGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  masterAccountId: z.string().min(1, "Master account is required").optional(),
  isActive: z.boolean().optional(),
});

export const addMemberSchema = memberRiskSettingsSchema;

export const updateMemberSchema = z.object({
  riskMultiplier: z
    .number()
    .min(0.1, "Risk multiplier must be at least 0.1")
    .max(3.0, "Risk multiplier must be at most 3.0")
    .optional(),
  maxLots: z
    .number()
    .min(1, "Max lots must be at least 1")
    .max(100, "Max lots must be at most 100")
    .optional(),
  maxDailyLoss: z
    .number()
    .min(0, "Max daily loss must be non-negative")
    .max(100000, "Max daily loss must be at most $100,000")
    .optional(),
  isActive: z.boolean().optional(),
});

export type MemberRiskSettings = z.infer<typeof memberRiskSettingsSchema>;
export type CreateCopyGroupInput = z.infer<typeof createCopyGroupSchema>;
export type UpdateCopyGroupInput = z.infer<typeof updateCopyGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
