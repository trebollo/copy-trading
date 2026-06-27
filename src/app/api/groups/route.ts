import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCopyGroupSchema } from "@/lib/validations/copy-group";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const [groups, total] = await Promise.all([
      prisma.copyGroup.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { members: true },
          },
          masterAccount: {
            select: { id: true, name: true, platform: true },
          },
        },
      }),
      prisma.copyGroup.count({ where }),
    ]);

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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
    const validation = createCopyGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, masterAccountId, members } = validation.data;

    // Generate a unique webhook secret for external callers
    const webhookSecret = randomBytes(32).toString("hex");

    const group = await prisma.copyGroup.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        masterAccountId,
        webhookSecret,
        isActive: true,
        members: {
          create: members.map((member) => ({
            tradingAccountId: member.accountId,
            riskMultiplier: member.riskMultiplier,
            maxLots: member.maxLots,
            maxDailyLoss: member.maxDailyLoss,
            isActive: member.isActive,
          })),
        },
      },
      include: {
        members: true,
        masterAccount: {
          select: { id: true, name: true, platform: true },
        },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
