import { describe, it, expect, vi } from "vitest";
import { CopyEngine, type CopyGroupConfig, type CopyGroupMember } from "@/lib/trading/copy-engine";
import type { TradeSignal, PlatformAdapter, Order } from "@/lib/trading/types";

describe("CopyEngine", () => {
  let engine: CopyEngine;

  beforeEach(() => {
    engine = new CopyEngine();
  });

  describe("calculateAdjustedQuantity", () => {
    it("returns original quantity when multiplier is 1.0", () => {
      const result = engine.calculateAdjustedQuantity(5, {
        riskMultiplier: 1.0,
        maxLots: 100,
      });
      expect(result).toBe(5);
    });

    it("scales quantity by risk multiplier", () => {
      const result = engine.calculateAdjustedQuantity(4, {
        riskMultiplier: 2.0,
        maxLots: 100,
      });
      expect(result).toBe(8);
    });

    it("floors fractional quantities", () => {
      const result = engine.calculateAdjustedQuantity(3, {
        riskMultiplier: 1.5,
        maxLots: 100,
      });
      // 3 * 1.5 = 4.5 -> floor = 4
      expect(result).toBe(4);
    });

    it("caps quantity at maxLots", () => {
      const result = engine.calculateAdjustedQuantity(10, {
        riskMultiplier: 2.0,
        maxLots: 15,
      });
      // 10 * 2 = 20, but capped at 15
      expect(result).toBe(15);
    });

    it("returns 0 when multiplier results in less than 1", () => {
      const result = engine.calculateAdjustedQuantity(1, {
        riskMultiplier: 0.5,
        maxLots: 100,
      });
      // 1 * 0.5 = 0.5 -> floor = 0
      expect(result).toBe(0);
    });

    it("handles very small multiplier with large quantity", () => {
      const result = engine.calculateAdjustedQuantity(10, {
        riskMultiplier: 0.1,
        maxLots: 100,
      });
      // 10 * 0.1 = 1 -> floor = 1
      expect(result).toBe(1);
    });

    it("maxLots of 1 caps at 1", () => {
      const result = engine.calculateAdjustedQuantity(5, {
        riskMultiplier: 3.0,
        maxLots: 1,
      });
      // 5 * 3 = 15, capped at 1
      expect(result).toBe(1);
    });
  });

  describe("checkRiskLimits", () => {
    const baseSignal: TradeSignal = {
      symbol: "ESZ4",
      side: "buy",
      type: "market",
      quantity: 2,
    };

    it("allows trade when daily loss is below limit", () => {
      const member: CopyGroupMember = {
        accountId: "acc-1",
        riskMultiplier: 1.0,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
        dailyLossUsed: 500,
      };

      const result = engine.checkRiskLimits(member, baseSignal);
      expect(result.allowed).toBe(true);
    });

    it("blocks trade when daily loss limit is reached", () => {
      const member: CopyGroupMember = {
        accountId: "acc-1",
        riskMultiplier: 1.0,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
        dailyLossUsed: 1000,
      };

      const result = engine.checkRiskLimits(member, baseSignal);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily loss limit reached");
    });

    it("blocks trade when daily loss exceeds limit", () => {
      const member: CopyGroupMember = {
        accountId: "acc-1",
        riskMultiplier: 1.0,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
        dailyLossUsed: 1200,
      };

      const result = engine.checkRiskLimits(member, baseSignal);
      expect(result.allowed).toBe(false);
    });

    it("blocks trade when adjusted quantity would be zero", () => {
      const member: CopyGroupMember = {
        accountId: "acc-1",
        riskMultiplier: 0.1,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
        dailyLossUsed: 0,
      };

      const signal: TradeSignal = {
        ...baseSignal,
        quantity: 1, // 1 * 0.1 = 0.1 -> floor = 0
      };

      const result = engine.checkRiskLimits(member, signal);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("zero");
    });

    it("allows trade when daily loss is zero", () => {
      const member: CopyGroupMember = {
        accountId: "acc-1",
        riskMultiplier: 1.0,
        maxLots: 10,
        maxDailyLoss: 1000,
        isActive: true,
        dailyLossUsed: 0,
      };

      const result = engine.checkRiskLimits(member, baseSignal);
      expect(result.allowed).toBe(true);
    });
  });

  describe("processTradeSignal", () => {
    const baseSignal: TradeSignal = {
      symbol: "ESZ4",
      side: "buy",
      type: "market",
      quantity: 2,
    };

    const mockOrder: Order = {
      id: "order-1",
      symbol: "ESZ4",
      side: "buy",
      type: "market",
      quantity: 2,
      status: "filled",
      createdAt: new Date(),
    };

    const createMockAdapter = (): PlatformAdapter => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      getAccountInfo: vi.fn(),
      getPositions: vi.fn(),
      getOrders: vi.fn(),
      placeTrade: vi.fn().mockResolvedValue(mockOrder),
      cancelOrder: vi.fn(),
      subscribeTrades: vi.fn(),
    });

    it("returns empty results when group is inactive", async () => {
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: false,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: true,
            dailyLossUsed: 0,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        createMockAdapter
      );

      expect(result.results).toHaveLength(0);
      expect(result.groupId).toBe("g1");
    });

    it("skips inactive members", async () => {
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: false,
            dailyLossUsed: 0,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        createMockAdapter
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].reason).toContain("inactive");
    });

    it("processes active members successfully", async () => {
      const mockAdapter = createMockAdapter();
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: true,
            dailyLossUsed: 0,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        () => mockAdapter
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].orderId).toBe("order-1");
      expect(mockAdapter.placeTrade).toHaveBeenCalledWith({
        ...baseSignal,
        quantity: 2,
      });
    });

    it("applies risk multiplier to copied trades", async () => {
      const mockAdapter = createMockAdapter();
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 2.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: true,
            dailyLossUsed: 0,
          },
        ],
      };

      await engine.processTradeSignal(group, baseSignal, () => mockAdapter);

      expect(mockAdapter.placeTrade).toHaveBeenCalledWith({
        ...baseSignal,
        quantity: 4, // 2 * 2.0 = 4
      });
    });

    it("handles adapter errors gracefully", async () => {
      const failingAdapter = createMockAdapter();
      (failingAdapter.placeTrade as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection timeout")
      );

      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: true,
            dailyLossUsed: 0,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        () => failingAdapter
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].reason).toBe("Connection timeout");
    });

    it("blocks members that exceed daily loss limit", async () => {
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 500,
            isActive: true,
            dailyLossUsed: 500,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        createMockAdapter
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].reason).toContain("Daily loss limit");
    });

    it("processes multiple members with different outcomes", async () => {
      const mockAdapter = createMockAdapter();
      const group: CopyGroupConfig = {
        id: "g1",
        name: "Test Group",
        isActive: true,
        masterAccountId: "master-1",
        members: [
          {
            accountId: "acc-1",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: true,
            dailyLossUsed: 0,
          },
          {
            accountId: "acc-2",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 1000,
            isActive: false,
            dailyLossUsed: 0,
          },
          {
            accountId: "acc-3",
            riskMultiplier: 1.0,
            maxLots: 10,
            maxDailyLoss: 100,
            isActive: true,
            dailyLossUsed: 100,
          },
        ],
      };

      const result = await engine.processTradeSignal(
        group,
        baseSignal,
        () => mockAdapter
      );

      expect(result.results).toHaveLength(3);
      // First member: successful
      expect(result.results[0].success).toBe(true);
      // Second member: inactive
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].reason).toContain("inactive");
      // Third member: daily loss limit
      expect(result.results[2].success).toBe(false);
      expect(result.results[2].reason).toContain("Daily loss limit");
    });
  });
});
