import { prisma } from "@/lib/prisma";

/**
 * Computes the total realized loss for a trading account for today.
 * Only considers trades with negative PnL that were closed today.
 * Returns a positive number representing the total loss amount.
 */
export async function getDailyLossForAccount(
  tradingAccountId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await prisma.trade.aggregate({
    where: {
      tradingAccountId,
      pnl: { lt: 0 },
      closedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    _sum: {
      pnl: true,
    },
  });

  // Return absolute value of the sum of negative PnL (as a positive loss number)
  return Math.abs(result._sum.pnl ?? 0);
}

/**
 * Computes daily loss for multiple trading accounts in a batch.
 * Returns a map from tradingAccountId to loss amount (positive number).
 */
export async function getDailyLossForAccounts(
  tradingAccountIds: string[]
): Promise<Map<string, number>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const results = await prisma.trade.groupBy({
    by: ["tradingAccountId"],
    where: {
      tradingAccountId: { in: tradingAccountIds },
      pnl: { lt: 0 },
      closedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    _sum: {
      pnl: true,
    },
  });

  const lossMap = new Map<string, number>();
  for (const id of tradingAccountIds) {
    lossMap.set(id, 0);
  }
  for (const row of results) {
    lossMap.set(row.tradingAccountId, Math.abs(row._sum.pnl ?? 0));
  }

  return lossMap;
}
