import { describe, it, expect } from "vitest";
import {
  createCopyGroupSchema,
  updateCopyGroupSchema,
  memberRiskSettingsSchema,
  updateMemberSchema,
} from "@/lib/validations/copy-group";

describe("memberRiskSettingsSchema", () => {
  it("accepts valid member risk settings", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.5,
      maxLots: 10,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskMultiplier).toBe(1.5);
      expect(result.data.maxLots).toBe(10);
    }
  });

  it("rejects riskMultiplier below 0.1", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 0.05,
      maxLots: 10,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors.riskMultiplier;
      expect(errors).toBeDefined();
      expect(errors![0]).toContain("0.1");
    }
  });

  it("rejects riskMultiplier above 3.0", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 3.5,
      maxLots: 10,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects maxLots below 1", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.0,
      maxLots: 0,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects maxLots above 100", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.0,
      maxLots: 101,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects negative maxDailyLoss", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.0,
      maxLots: 10,
      maxDailyLoss: -100,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects maxDailyLoss above 100000", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.0,
      maxLots: 10,
      maxDailyLoss: 150000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty accountId", () => {
    const data = {
      accountId: "",
      riskMultiplier: 1.0,
      maxLots: 10,
      maxDailyLoss: 1000,
      isActive: true,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("defaults isActive to true when not provided", () => {
    const data = {
      accountId: "acc-1",
      riskMultiplier: 1.0,
      maxLots: 10,
      maxDailyLoss: 1000,
    };

    const result = memberRiskSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });
});

describe("createCopyGroupSchema", () => {
  it("accepts valid group creation data", () => {
    const data = {
      name: "My Copy Group",
      description: "A test group",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Copy Group");
      expect(result.data.members).toHaveLength(1);
    }
  });

  it("accepts group without description", () => {
    const data = {
      name: "My Group",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const data = {
      name: "My Group",
      description: "",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const data = {
      name: "",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
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
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty masterAccountId", () => {
    const data = {
      name: "My Group",
      masterAccountId: "",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty members array", () => {
    const data = {
      name: "My Group",
      masterAccountId: "master-1",
      members: [],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const memberErrors = result.error.flatten().fieldErrors.members;
      expect(memberErrors).toBeDefined();
      expect(memberErrors![0]).toContain("At least one follower");
    }
  });

  it("rejects description longer than 500 characters", () => {
    const data = {
      name: "My Group",
      description: "a".repeat(501),
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("validates nested member risk settings", () => {
    const data = {
      name: "My Group",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 5.0, // too high
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts multiple members", () => {
    const data = {
      name: "Multi Member Group",
      masterAccountId: "master-1",
      members: [
        {
          accountId: "acc-1",
          riskMultiplier: 1.0,
          maxLots: 10,
          maxDailyLoss: 1000,
          isActive: true,
        },
        {
          accountId: "acc-2",
          riskMultiplier: 0.5,
          maxLots: 5,
          maxDailyLoss: 500,
          isActive: true,
        },
        {
          accountId: "acc-3",
          riskMultiplier: 2.0,
          maxLots: 20,
          maxDailyLoss: 2000,
          isActive: false,
        },
      ],
    };

    const result = createCopyGroupSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.members).toHaveLength(3);
    }
  });
});

describe("updateCopyGroupSchema", () => {
  it("accepts partial update with just name", () => {
    const result = updateCopyGroupSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with isActive", () => {
    const result = updateCopyGroupSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no updates)", () => {
    const result = updateCopyGroupSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name if provided", () => {
    const result = updateCopyGroupSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty masterAccountId if provided", () => {
    const result = updateCopyGroupSchema.safeParse({ masterAccountId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid description update", () => {
    const result = updateCopyGroupSchema.safeParse({
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const result = updateCopyGroupSchema.safeParse({ description: "" });
    expect(result.success).toBe(true);
  });
});

describe("updateMemberSchema", () => {
  it("accepts partial update with riskMultiplier", () => {
    const result = updateMemberSchema.safeParse({ riskMultiplier: 1.5 });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with isActive", () => {
    const result = updateMemberSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateMemberSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid riskMultiplier", () => {
    const result = updateMemberSchema.safeParse({ riskMultiplier: 10.0 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid maxLots", () => {
    const result = updateMemberSchema.safeParse({ maxLots: 200 });
    expect(result.success).toBe(false);
  });
});
