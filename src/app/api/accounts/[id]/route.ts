import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTradingAccountSchema } from "@/lib/validations/trading-account";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.tradingAccount.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        trades: {
          orderBy: { openedAt: "desc" },
          take: 50,
        },
        dailyMetrics: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateTradingAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.tradingAccount.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    const { name, platform, accountId, apiKey, apiSecret, status } =
      validation.data;

    if (name !== undefined) data.name = name;
    if (platform !== undefined) data.platform = platform;
    if (accountId !== undefined) data.accountId = accountId;
    if (apiKey !== undefined) data.apiKey = apiKey || null;
    if (apiSecret !== undefined) data.apiSecret = apiSecret || null;
    if (status !== undefined) data.status = status;

    const account = await prisma.tradingAccount.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.tradingAccount.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Soft delete - set status to inactive
    await prisma.tradingAccount.update({
      where: { id: params.id },
      data: { status: "deleted" },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
