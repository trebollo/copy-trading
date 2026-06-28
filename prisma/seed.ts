import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@copytrader.app" },
    update: {},
    create: {
      id: "demo-user-1",
      name: "Demo Trader",
      email: "demo@copytrader.app",
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Create trading accounts
  const masterAccount = await prisma.tradingAccount.upsert({
    where: { id: "acct-master-1" },
    update: {},
    create: {
      id: "acct-master-1",
      userId: user.id,
      name: "Apex Funded 50K",
      platform: "Tradovate",
      accountId: "APX-50001",
      balance: 52340.0,
      status: "active",
    },
  });

  const follower1 = await prisma.tradingAccount.upsert({
    where: { id: "acct-follower-1" },
    update: {},
    create: {
      id: "acct-follower-1",
      userId: user.id,
      name: "TopStep 150K",
      platform: "Tradovate",
      accountId: "TS-150002",
      balance: 148920.5,
      status: "active",
    },
  });

  const follower2 = await prisma.tradingAccount.upsert({
    where: { id: "acct-follower-2" },
    update: {},
    create: {
      id: "acct-follower-2",
      userId: user.id,
      name: "Apex Funded 100K",
      platform: "Tradovate",
      accountId: "APX-100003",
      balance: 101250.0,
      status: "active",
    },
  });

  console.log(`Created ${3} trading accounts`);

  // Create copy group
  const group = await prisma.copyGroup.upsert({
    where: { id: "group-1" },
    update: {},
    create: {
      id: "group-1",
      userId: user.id,
      name: "ES Scalping Group",
      description: "Copies ES micro scalp trades from master to all funded accounts",
      masterAccountId: masterAccount.id,
      isActive: true,
    },
  });

  // Create group members (followers)
  await prisma.copyGroupMember.upsert({
    where: { groupId_tradingAccountId: { groupId: group.id, tradingAccountId: follower1.id } },
    update: {},
    create: {
      groupId: group.id,
      tradingAccountId: follower1.id,
      riskMultiplier: 1.5,
      maxLots: 5.0,
      maxDailyLoss: 2000.0,
      isActive: true,
    },
  });

  await prisma.copyGroupMember.upsert({
    where: { groupId_tradingAccountId: { groupId: group.id, tradingAccountId: follower2.id } },
    update: {},
    create: {
      groupId: group.id,
      tradingAccountId: follower2.id,
      riskMultiplier: 1.0,
      maxLots: 3.0,
      maxDailyLoss: 1500.0,
      isActive: true,
    },
  });

  console.log(`Created copy group: ${group.name} with 2 followers`);

  // Generate trades for the last 30 days
  const symbols = ["ES", "NQ", "RTY", "ES", "ES", "NQ"];
  const sides = ["long", "short"];
  const now = new Date();
  const trades: Array<{
    tradingAccountId: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    pnl: number;
    status: string;
    openedAt: Date;
    closedAt: Date;
  }> = [];

  for (let day = 30; day >= 1; day--) {
    const tradeDate = new Date(now);
    tradeDate.setDate(tradeDate.getDate() - day);

    // 2-5 trades per day on the master
    const tradesPerDay = Math.floor(Math.random() * 4) + 2;
    for (let t = 0; t < tradesPerDay; t++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const isWin = Math.random() < 0.64;
      const pnl = isWin
        ? Math.round((Math.random() * 500 + 50) * 100) / 100
        : Math.round((-Math.random() * 300 - 25) * 100) / 100;

      const openTime = new Date(tradeDate);
      openTime.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));
      const closeTime = new Date(openTime);
      closeTime.setMinutes(closeTime.getMinutes() + Math.floor(Math.random() * 45) + 5);

      let price: number;
      if (symbol === "ES") price = 5250 + Math.random() * 100;
      else if (symbol === "NQ") price = 18500 + Math.random() * 200;
      else price = 2100 + Math.random() * 50;

      trades.push({
        tradingAccountId: masterAccount.id,
        symbol,
        side,
        quantity,
        price: Math.round(price * 100) / 100,
        pnl,
        status: "closed",
        openedAt: openTime,
        closedAt: closeTime,
      });
    }
  }

  // Batch create trades
  await prisma.trade.createMany({
    data: trades,
    skipDuplicates: true,
  });

  console.log(`Created ${trades.length} trades for master account`);

  // Generate daily metrics for the last 30 days
  const dailyMetrics: Array<{
    tradingAccountId: string;
    date: Date;
    pnl: number;
    trades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
  }> = [];

  for (const account of [masterAccount, follower1, follower2]) {
    for (let day = 30; day >= 1; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);

      const dayTrades = Math.floor(Math.random() * 5) + 1;
      const winRate = 0.5 + Math.random() * 0.3;
      const avgWin = 150 + Math.random() * 250;
      const avgLoss = -(80 + Math.random() * 150);
      const wins = Math.round(dayTrades * winRate);
      const losses = dayTrades - wins;
      const pnl = Math.round((wins * avgWin + losses * avgLoss) * 100) / 100;

      dailyMetrics.push({
        tradingAccountId: account.id,
        date,
        pnl,
        trades: dayTrades,
        winRate: Math.round(winRate * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
      });
    }
  }

  await prisma.dailyMetric.createMany({
    data: dailyMetrics,
    skipDuplicates: true,
  });

  console.log(`Created ${dailyMetrics.length} daily metric records`);

  // Create user preferences
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      defaultRiskMultiplier: 1.0,
      timezone: "America/New_York",
      darkMode: false,
      notifyTradeCopied: true,
      notifyDailyReport: true,
      notifyRiskLimitHit: true,
    },
  });

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
