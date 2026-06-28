import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregateMetrics, TradeData, DailyMetricData } from "@/lib/metrics/calculations";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // In DEMO_MODE, return mock data instead of 401
      if (process.env.DEMO_MODE === "true") {
        return NextResponse.json({
          metrics: {
            totalPnl: 4832.5,
            totalTrades: 142,
            winRate: 0.64,
            profitFactor: 2.15,
            maxDrawdown: 1250,
            sharpeRatio: 1.87,
            equityCurve: [
              { date: "2025-01-01", equity: 50000.0 },
              { date: "2025-01-05", equity: 50410.62 },
              { date: "2025-01-10", equity: 51580.35 },
              { date: "2025-01-15", equity: 52235.9 },
              { date: "2025-01-20", equity: 52745.2 },
              { date: "2025-01-25", equity: 53780.25 },
              { date: "2025-01-30", equity: 54432.5 },
            ],
          },
          accountCount: 3,
          activeAccountCount: 2,
        });
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Get all user's trading accounts
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, status: true },
    });

    const accountIds = accounts.map((a: { id: string; name: string; status: string }) => a.id);

    // Fetch trades and daily metrics for all accounts
    const [trades, dailyMetrics] = await Promise.all([
      prisma.trade.findMany({
        where: {
          tradingAccountId: { in: accountIds },
          ...(from || to
            ? { openedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined }
            : {}),
        },
        select: { pnl: true, status: true },
      }),
      prisma.dailyMetric.findMany({
        where: {
          tradingAccountId: { in: accountIds },
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

    const metrics = aggregateMetrics(tradeData, metricData);

    return NextResponse.json({
      metrics,
      accountCount: accounts.length,
      activeAccountCount: accounts.filter((a: { id: string; name: string; status: string }) => a.status === "active").length,
    });
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
