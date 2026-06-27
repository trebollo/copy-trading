import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTradingAccountSchema } from "@/lib/validations/trading-account";
import { redactAccountCredentials } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const [accounts, total] = await Promise.all([
      prisma.tradingAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tradingAccount.count({ where }),
    ]);

    return NextResponse.json({
      accounts: accounts.map(redactAccountCredentials),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTradingAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, platform, accountId, apiKey, apiSecret } = validation.data;

    const account = await prisma.tradingAccount.create({
      data: {
        userId: session.user.id,
        name,
        platform,
        accountId,
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
      },
    });

    return NextResponse.json({ account: redactAccountCredentials(account) }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
