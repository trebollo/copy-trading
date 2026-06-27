import { describe, it, expect } from "vitest";
import {
  createTradingAccountSchema,
  updateTradingAccountSchema,
} from "@/lib/validations/trading-account";
import { TradingPlatform } from "@/lib/trading/types";

describe("createTradingAccountSchema", () => {
  it("accepts valid data with all fields", () => {
    const data = {
      name: "My Account",
      platform: TradingPlatform.TRADOVATE,
      accountId: "ACC-001",
      apiKey: "my-api-key",
      apiSecret: "my-secret",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Account");
      expect(result.data.platform).toBe(TradingPlatform.TRADOVATE);
    }
  });

  it("accepts valid data without optional fields", () => {
    const data = {
      name: "Basic Account",
      platform: TradingPlatform.NINJATRADER,
      accountId: "NT-100",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts empty string for apiKey and apiSecret", () => {
    const data = {
      name: "Account",
      platform: TradingPlatform.RITHMIC,
      accountId: "R-001",
      apiKey: "",
      apiSecret: "",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const data = {
      name: "",
      platform: TradingPlatform.TRADOVATE,
      accountId: "ACC-001",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameErrors = result.error.flatten().fieldErrors.name;
      expect(nameErrors).toBeDefined();
      expect(nameErrors![0]).toContain("required");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const data = {
      name: "a".repeat(101),
      platform: TradingPlatform.TRADOVATE,
      accountId: "ACC-001",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform", () => {
    const data = {
      name: "My Account",
      platform: "INVALID_PLATFORM",
      accountId: "ACC-001",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const platformErrors = result.error.flatten().fieldErrors.platform;
      expect(platformErrors).toBeDefined();
      expect(platformErrors![0]).toContain("valid trading platform");
    }
  });

  it("rejects empty accountId", () => {
    const data = {
      name: "My Account",
      platform: TradingPlatform.TRADOVATE,
      accountId: "",
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const accountIdErrors = result.error.flatten().fieldErrors.accountId;
      expect(accountIdErrors).toBeDefined();
    }
  });

  it("rejects accountId longer than 50 characters", () => {
    const data = {
      name: "My Account",
      platform: TradingPlatform.TRADOVATE,
      accountId: "a".repeat(51),
    };

    const result = createTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createTradingAccountSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateTradingAccountSchema", () => {
  it("accepts partial update with just name", () => {
    const data = { name: "Updated Name" };

    const result = updateTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Name");
    }
  });

  it("accepts partial update with status", () => {
    const data = { status: "inactive" as const };

    const result = updateTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no updates)", () => {
    const result = updateTradingAccountSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const data = { status: "unknown" };

    const result = updateTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["active", "inactive", "error"]) {
      const result = updateTradingAccountSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty name if provided", () => {
    const data = { name: "" };

    const result = updateTradingAccountSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
