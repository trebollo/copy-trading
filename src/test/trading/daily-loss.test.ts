import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    trade: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { getDailyLossForAccount, getDailyLossForAccounts } from "@/lib/trading/daily-loss";
import { prisma } from "@/lib/prisma";

describe("daily-loss", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDailyLossForAccount", () => {
    it("returns 0 when there are no negative PnL trades", async () => {
      (prisma.trade.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { pnl: null },
      });

      const result = await getDailyLossForAccount("acc-1");
      expect(result).toBe(0);
    });

    it("returns absolute value of negative PnL sum", async () => {
      (prisma.trade.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { pnl: -350.75 },
      });

      const result = await getDailyLossForAccount("acc-1");
      expect(result).toBe(350.75);
    });

    it("queries with correct date range and filters", async () => {
      (prisma.trade.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { pnl: -100 },
      });

      await getDailyLossForAccount("acc-123");

      expect(prisma.trade.aggregate).toHaveBeenCalledWith({
        where: {
          tradingAccountId: "acc-123",
          pnl: { lt: 0 },
          closedAt: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
        _sum: {
          pnl: true,
        },
      });

      // Verify the date range covers today
      const call = (prisma.trade.aggregate as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const gte = call.where.closedAt.gte as Date;
      const lt = call.where.closedAt.lt as Date;
      expect(gte.getHours()).toBe(0);
      expect(gte.getMinutes()).toBe(0);
      expect(lt.getTime() - gte.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("getDailyLossForAccounts", () => {
    it("returns 0 for accounts with no losses", async () => {
      (prisma.trade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await getDailyLossForAccounts(["acc-1", "acc-2"]);
      expect(result.get("acc-1")).toBe(0);
      expect(result.get("acc-2")).toBe(0);
    });

    it("returns correct loss amounts per account", async () => {
      (prisma.trade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { tradingAccountId: "acc-1", _sum: { pnl: -250 } },
        { tradingAccountId: "acc-2", _sum: { pnl: -100 } },
      ]);

      const result = await getDailyLossForAccounts(["acc-1", "acc-2", "acc-3"]);
      expect(result.get("acc-1")).toBe(250);
      expect(result.get("acc-2")).toBe(100);
      expect(result.get("acc-3")).toBe(0);
    });

    it("queries with correct parameters", async () => {
      (prisma.trade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getDailyLossForAccounts(["acc-1", "acc-2"]);

      expect(prisma.trade.groupBy).toHaveBeenCalledWith({
        by: ["tradingAccountId"],
        where: {
          tradingAccountId: { in: ["acc-1", "acc-2"] },
          pnl: { lt: 0 },
          closedAt: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
        _sum: {
          pnl: true,
        },
      });
    });
  });
});
