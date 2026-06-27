/**
 * Pure metric calculation functions for trading analytics.
 * These work on arrays of Trade/DailyMetric objects and return computed values.
 */

export interface TradeData {
  pnl: number | null;
  status: string;
}

export interface DailyMetricData {
  date: string | Date;
  pnl: number;
  trades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
}

export interface AggregatedMetrics {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  bestDay: number;
  worstDay: number;
  equityCurve: EquityCurvePoint[];
}

/**
 * Calculate win rate from an array of trades.
 * Only considers closed trades with non-null PnL.
 * Returns value between 0 and 1.
 */
export function calculateWinRate(trades: TradeData[]): number {
  const closedTrades = trades.filter(
    (t) => t.pnl !== null && t.status === "closed"
  );
  if (closedTrades.length === 0) return 0;

  const wins = closedTrades.filter((t) => (t.pnl as number) > 0).length;
  return wins / closedTrades.length;
}

/**
 * Calculate maximum drawdown from an array of daily PnL values.
 * Returns a positive number representing the max peak-to-trough decline.
 */
export function calculateMaxDrawdown(dailyPnls: number[]): number {
  if (dailyPnls.length === 0) return 0;

  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  for (const pnl of dailyPnls) {
    cumulative += pnl;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate profit factor: sum of winning trades / abs(sum of losing trades).
 * Returns Infinity if no losing trades, 0 if no winning trades.
 */
export function calculateProfitFactor(trades: TradeData[]): number {
  const closedTrades = trades.filter(
    (t) => t.pnl !== null && t.status === "closed"
  );
  if (closedTrades.length === 0) return 0;

  const totalWins = closedTrades
    .filter((t) => (t.pnl as number) > 0)
    .reduce((sum, t) => sum + (t.pnl as number), 0);

  const totalLosses = Math.abs(
    closedTrades
      .filter((t) => (t.pnl as number) < 0)
      .reduce((sum, t) => sum + (t.pnl as number), 0)
  );

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / totalLosses;
}

/**
 * Calculate Sharpe Ratio from daily PnL values.
 * Uses annualized formula: (mean daily return / std dev of daily returns) * sqrt(252)
 * 252 is the standard number of trading days in a year.
 */
export function calculateSharpeRatio(dailyPnls: number[]): number {
  if (dailyPnls.length < 2) return 0;

  const mean = dailyPnls.reduce((sum, pnl) => sum + pnl, 0) / dailyPnls.length;

  const variance =
    dailyPnls.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) /
    (dailyPnls.length - 1);

  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;

  return (mean / stdDev) * Math.sqrt(252);
}

/**
 * Calculate average winning trade amount.
 * Returns 0 if no winning trades.
 */
export function calculateAverageWin(trades: TradeData[]): number {
  const wins = trades.filter(
    (t) => t.pnl !== null && t.status === "closed" && (t.pnl as number) > 0
  );
  if (wins.length === 0) return 0;
  return wins.reduce((sum, t) => sum + (t.pnl as number), 0) / wins.length;
}

/**
 * Calculate average losing trade amount (returned as a positive number).
 * Returns 0 if no losing trades.
 */
export function calculateAverageLoss(trades: TradeData[]): number {
  const losses = trades.filter(
    (t) => t.pnl !== null && t.status === "closed" && (t.pnl as number) < 0
  );
  if (losses.length === 0) return 0;
  return (
    Math.abs(losses.reduce((sum, t) => sum + (t.pnl as number), 0)) /
    losses.length
  );
}

/**
 * Calculate equity curve from daily metrics.
 * Returns an array of cumulative PnL points.
 */
export function calculateEquityCurve(
  dailyMetrics: DailyMetricData[]
): EquityCurvePoint[] {
  if (dailyMetrics.length === 0) return [];

  const sorted = [...dailyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulative = 0;
  return sorted.map((metric) => {
    cumulative += metric.pnl;
    return {
      date:
        typeof metric.date === "string"
          ? metric.date
          : metric.date.toISOString().split("T")[0],
      equity: cumulative,
    };
  });
}

/**
 * Aggregate all metrics from trades and daily metrics data.
 */
export function aggregateMetrics(
  trades: TradeData[],
  dailyMetrics: DailyMetricData[]
): AggregatedMetrics {
  const dailyPnls = dailyMetrics.map((m) => m.pnl);

  return {
    totalPnl: dailyPnls.reduce((sum, pnl) => sum + pnl, 0),
    totalTrades: trades.filter((t) => t.status === "closed").length,
    winRate: calculateWinRate(trades),
    profitFactor: calculateProfitFactor(trades),
    maxDrawdown: calculateMaxDrawdown(dailyPnls),
    sharpeRatio: calculateSharpeRatio(dailyPnls),
    averageWin: calculateAverageWin(trades),
    averageLoss: calculateAverageLoss(trades),
    bestDay: dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0,
    worstDay: dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0,
    equityCurve: calculateEquityCurve(dailyMetrics),
  };
}
