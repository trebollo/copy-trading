import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPlatformAdapter } from "@/lib/trading/adapter-factory";
import { TradingPlatform } from "@/lib/trading/types";

export async function POST(
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
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const platform = account.platform as TradingPlatform;
    const adapter = createPlatformAdapter(platform);

    await adapter.connect({
      apiKey: account.apiKey || undefined,
      apiSecret: account.apiSecret || undefined,
      accountId: account.accountId,
    });

    const accountInfo = await adapter.getAccountInfo();

    await adapter.disconnect();

    const updatedAccount = await prisma.tradingAccount.update({
      where: { id: params.id },
      data: {
        balance: accountInfo.balance,
        status: accountInfo.status,
      },
    });

    return NextResponse.json({
      account: updatedAccount,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error syncing account:", error);

    // Update status to error if sync fails
    try {
      await prisma.tradingAccount.update({
        where: { id: params.id },
        data: { status: "error" },
      });
    } catch {
      // Ignore secondary error
    }

    return NextResponse.json(
      { error: "Failed to sync account with trading platform" },
      { status: 500 }
    );
  }
}
