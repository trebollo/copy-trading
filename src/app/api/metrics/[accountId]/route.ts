import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateWinRate,
  calculateMaxDrawdown,
  calculateProfitFactor,
  calculateSharpeRatio,
  calculateAverageWin,
  calculateAverageLoss,
  calculateEquityCurve,
  TradeData,
  DailyMetricData,
} from "@/lib/metrics/calculations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;

    // Verify account belongs to user
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Fetch trades and daily metrics
    const [trades, dailyMetrics] = await Promise.all([
      prisma.trade.findMany({
        where: {
          tradingAccountId: accountId,
          ...(from || to
            ? { openedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined }
            : {}),
        },
        select: { pnl: true, status: true },
      }),
      prisma.dailyMetric.findMany({
        where: {
          tradingAccountId: accountId,
          ...(from || to
            ? { date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined }
            : {}),
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const tradeData: TradeData[] = trades.map((t: { pnl: number | null; status: string }) => ({
      pnl: t.pnl,
      status: t.status,
    }));

    const metricData: DailyMetricData[] = dailyMetrics.map((m: { date: Date; pnl: number; trades: number; winRate: number; avgWin: number; avgLoss: number }) => ({
      date: m.date.toISOString().split("T")[0],
      pnl: m.pnl,
      trades: m.trades,
      winRate: m.winRate,
      avgWin: m.avgWin,
      avgLoss: m.avgLoss,
    }));

    const dailyPnls = metricData.map((m) => m.pnl);

    return NextResponse.json({
      account: {
        id: account.id,
        name: account.name,
        platform: account.platform,
        status: account.status,
      },
      metrics: {
        totalPnl: dailyPnls.reduce((sum, pnl) => sum + pnl, 0),
        totalTrades: tradeData.filter((t) => t.status === "closed").length,
        winRate: calculateWinRate(tradeData),
        maxDrawdown: calculateMaxDrawdown(dailyPnls),
        profitFactor: calculateProfitFactor(tradeData),
        sharpeRatio: calculateSharpeRatio(dailyPnls),
        averageWin: calculateAverageWin(tradeData),
        averageLoss: calculateAverageLoss(tradeData),
        bestDay: dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0,
        worstDay: dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0,
      },
      dailyMetrics: metricData,
      equityCurve: calculateEquityCurve(metricData),
    });
  } catch (error) {
    console.error("Error fetching account metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch account metrics" },
      { status: 500 }
    );
  }
}
