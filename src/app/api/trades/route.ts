import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        return NextResponse.json({ trades: [], total: 0 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get all user's trading account IDs
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const accountIds = accounts.map((a: { id: string }) => a.id);

    if (accountIds.length === 0) {
      return NextResponse.json({ trades: [], total: 0 });
    }

    // Fetch trades for all user accounts
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { tradingAccountId: { in: accountIds } },
        orderBy: { openedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          symbol: true,
          side: true,
          quantity: true,
          price: true,
          pnl: true,
          status: true,
          openedAt: true,
          closedAt: true,
        },
      }),
      prisma.trade.count({
        where: { tradingAccountId: { in: accountIds } },
      }),
    ]);

    return NextResponse.json({
      trades: trades.map((t: { id: string; symbol: string; side: string; quantity: number; price: number; pnl: number | null; status: string; openedAt: Date; closedAt: Date | null }) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entryPrice: t.price,
        pnl: t.pnl,
        status: t.status,
        openedAt: t.openedAt.toISOString(),
        closedAt: t.closedAt?.toISOString() ?? null,
      })),
      total,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}
