import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { copyEngine } from "@/lib/trading/copy-engine";
import { createPlatformAdapter } from "@/lib/trading/adapter-factory";
import { TradingPlatform, type TradeSignal } from "@/lib/trading/types";
import { getDailyLossForAccounts } from "@/lib/trading/daily-loss";
import { decrypt } from "@/lib/crypto";
import { z } from "zod";

const tradeSignalSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop", "stop_limit"]),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  takeProfit: z.number().optional(),
  stopLoss: z.number().optional(),
});

/**
 * POST /api/groups/[id]/webhook
 *
 * Accepts a trade signal from the master account and runs it through
 * the copy engine to copy the trade to all active followers in the group.
 *
 * Authentication: Either a valid NextAuth session (browser) or an
 * x-api-key header matching the group's webhookSecret (external callers).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try session auth first, fall back to API key auth
    const session = await getServerSession(authOptions);
    const apiKey = request.headers.get("x-api-key");

    let authenticatedUserId: string | null = null;

    if (session?.user?.id) {
      authenticatedUserId = session.user.id;
    } else if (apiKey) {
      // Validate API key against the group's webhookSecret
      const group = await prisma.copyGroup.findFirst({
        where: { id, webhookSecret: apiKey },
        select: { userId: true },
      });

      if (group) {
        authenticatedUserId = group.userId;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = tradeSignalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verify group ownership and fetch members
    const group = await prisma.copyGroup.findFirst({
      where: { id, userId: authenticatedUserId },
      include: {
        members: {
          include: {
            tradingAccount: true,
          },
        },
        masterAccount: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.isActive) {
      return NextResponse.json(
        { error: "Group is not active" },
        { status: 400 }
      );
    }

    const signal: TradeSignal = validation.data;

    // Compute actual daily loss for each member account
    const memberAccountIds = group.members.map((m: { tradingAccountId: string }) => m.tradingAccountId);
    const dailyLossMap = await getDailyLossForAccounts(memberAccountIds);

    // Build the copy group config for the engine
    const groupConfig = {
      id: group.id,
      name: group.name,
      isActive: group.isActive,
      masterAccountId: group.masterAccountId,
      members: (group.members as Array<{ tradingAccountId: string; riskMultiplier: number; maxLots: number | null; maxDailyLoss: number | null; isActive: boolean }>).map((member) => ({
        accountId: member.tradingAccountId,
        riskMultiplier: member.riskMultiplier,
        maxLots: member.maxLots ?? 100,
        maxDailyLoss: member.maxDailyLoss ?? 100000,
        isActive: member.isActive,
        dailyLossUsed: dailyLossMap.get(member.tradingAccountId) ?? 0,
      })),
    };

    // Create adapter getter that connects adapters for each member account
    const getAdapter = (accountId: string) => {
      const memberEntry = (group.members as Array<{ tradingAccountId: string; tradingAccount: { platform: string; apiKey: string | null; apiSecret: string | null; accountId: string } }>).find(
        (m) => m.tradingAccountId === accountId
      );
      if (!memberEntry) {
        throw new Error(`No member found for account ${accountId}`);
      }
      const account = memberEntry.tradingAccount;
      const platform = account.platform as TradingPlatform;
      const adapter = createPlatformAdapter(platform);

      // Connect the adapter with decrypted credentials before use
      const credentials = {
        apiKey: decrypt(account.apiKey) || undefined,
        apiSecret: decrypt(account.apiSecret) || undefined,
        accountId: account.accountId,
      };
      adapter.connect(credentials);

      return adapter;
    };

    const result = await copyEngine.processTradeSignal(
      groupConfig,
      signal,
      getAdapter
    );

    return NextResponse.json({
      groupId: result.groupId,
      signal: result.masterSignal,
      results: result.results,
      timestamp: result.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process trade signal" },
      { status: 500 }
    );
  }
}
