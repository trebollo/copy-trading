import { describe, it, expect } from "vitest";
import {
  calculateWinRate,
  calculateMaxDrawdown,
  calculateProfitFactor,
  calculateSharpeRatio,
  calculateAverageWin,
  calculateAverageLoss,
  calculateEquityCurve,
  aggregateMetrics,
  TradeData,
  DailyMetricData,
} from "@/lib/metrics/calculations";

describe("metrics calculations", () => {
  describe("calculateWinRate", () => {
    it("returns 0 for empty trades array", () => {
      expect(calculateWinRate([])).toBe(0);
    });

    it("returns 0 when no closed trades", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "open" },
        { pnl: -50, status: "open" },
      ];
      expect(calculateWinRate(trades)).toBe(0);
    });

    it("calculates correct win rate for all winners", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: 200, status: "closed" },
        { pnl: 50, status: "closed" },
      ];
      expect(calculateWinRate(trades)).toBe(1);
    });

    it("calculates correct win rate for mixed trades", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: -50, status: "closed" },
        { pnl: 200, status: "closed" },
        { pnl: -30, status: "closed" },
      ];
      expect(calculateWinRate(trades)).toBe(0.5);
    });

    it("ignores trades with null pnl", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: null, status: "closed" },
        { pnl: -50, status: "closed" },
      ];
      expect(calculateWinRate(trades)).toBeCloseTo(0.5);
    });

    it("ignores open trades", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: -200, status: "open" },
        { pnl: -50, status: "closed" },
      ];
      expect(calculateWinRate(trades)).toBe(0.5);
    });
  });

  describe("calculateMaxDrawdown", () => {
    it("returns 0 for empty array", () => {
      expect(calculateMaxDrawdown([])).toBe(0);
    });

    it("returns 0 for all positive PnL", () => {
      expect(calculateMaxDrawdown([100, 200, 50, 300])).toBe(0);
    });

    it("calculates correct drawdown for simple case", () => {
      // Cumulative: 100, 200, 100, 50, 150
      // Peak: 200, Trough after peak: 50 => Drawdown = 150
      expect(calculateMaxDrawdown([100, 100, -100, -50, 100])).toBe(150);
    });

    it("handles all negative PnL", () => {
      // Cumulative: -100, -200, -300
      // Peak starts at 0, never goes above. Drawdown = 300
      expect(calculateMaxDrawdown([-100, -100, -100])).toBe(300);
    });

    it("handles single value drawdown", () => {
      expect(calculateMaxDrawdown([-50])).toBe(50);
    });

    it("finds deepest drawdown among multiple", () => {
      // Cumulative: 100, 50, 200, 50, 100
      // Peak 1: 100, Trough: 50 => DD = 50
      // Peak 2: 200, Trough: 50 => DD = 150
      expect(calculateMaxDrawdown([100, -50, 150, -150, 50])).toBe(150);
    });
  });

  describe("calculateProfitFactor", () => {
    it("returns 0 for empty trades", () => {
      expect(calculateProfitFactor([])).toBe(0);
    });

    it("returns Infinity when no losses", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: 200, status: "closed" },
      ];
      expect(calculateProfitFactor(trades)).toBe(Infinity);
    });

    it("returns 0 when no wins and there are losses", () => {
      const trades: TradeData[] = [
        { pnl: -100, status: "closed" },
        { pnl: -200, status: "closed" },
      ];
      expect(calculateProfitFactor(trades)).toBe(0);
    });

    it("calculates correct profit factor", () => {
      const trades: TradeData[] = [
        { pnl: 300, status: "closed" },
        { pnl: -100, status: "closed" },
        { pnl: 200, status: "closed" },
        { pnl: -50, status: "closed" },
      ];
      // Wins: 300 + 200 = 500, Losses: |-100| + |-50| = 150
      // PF = 500 / 150 = 3.333...
      expect(calculateProfitFactor(trades)).toBeCloseTo(3.333, 2);
    });

    it("returns 0 when no closed trades", () => {
      const trades: TradeData[] = [{ pnl: 100, status: "open" }];
      expect(calculateProfitFactor(trades)).toBe(0);
    });
  });

  describe("calculateSharpeRatio", () => {
    it("returns 0 for empty array", () => {
      expect(calculateSharpeRatio([])).toBe(0);
    });

    it("returns 0 for single value", () => {
      expect(calculateSharpeRatio([100])).toBe(0);
    });

    it("returns 0 when standard deviation is 0", () => {
      expect(calculateSharpeRatio([100, 100, 100])).toBe(0);
    });

    it("returns positive value for mostly positive returns", () => {
      const dailyPnls = [100, 150, 80, 120, 90, 110, 130, 95, 105, 140];
      const result = calculateSharpeRatio(dailyPnls);
      expect(result).toBeGreaterThan(0);
    });

    it("returns negative value for mostly negative returns", () => {
      const dailyPnls = [-100, -150, -80, -120, -90];
      const result = calculateSharpeRatio(dailyPnls);
      expect(result).toBeLessThan(0);
    });

    it("calculates sharpe ratio correctly for known values", () => {
      // Mean = 10, StdDev calculation
      const dailyPnls = [10, 20, 0, 10, 10];
      const mean = 10;
      const variance =
        ((10 - mean) ** 2 +
          (20 - mean) ** 2 +
          (0 - mean) ** 2 +
          (10 - mean) ** 2 +
          (10 - mean) ** 2) /
        4; // sample variance, n-1
      const stdDev = Math.sqrt(variance);
      const expectedSharpe = (mean / stdDev) * Math.sqrt(252);
      expect(calculateSharpeRatio(dailyPnls)).toBeCloseTo(expectedSharpe, 4);
    });
  });

  describe("calculateAverageWin", () => {
    it("returns 0 for empty trades", () => {
      expect(calculateAverageWin([])).toBe(0);
    });

    it("returns 0 when no winning trades", () => {
      const trades: TradeData[] = [
        { pnl: -100, status: "closed" },
        { pnl: -50, status: "closed" },
      ];
      expect(calculateAverageWin(trades)).toBe(0);
    });

    it("calculates correct average win", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: -50, status: "closed" },
        { pnl: 200, status: "closed" },
        { pnl: 300, status: "closed" },
      ];
      // (100 + 200 + 300) / 3 = 200
      expect(calculateAverageWin(trades)).toBe(200);
    });

    it("ignores open trades", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: 500, status: "open" },
      ];
      expect(calculateAverageWin(trades)).toBe(100);
    });
  });

  describe("calculateAverageLoss", () => {
    it("returns 0 for empty trades", () => {
      expect(calculateAverageLoss([])).toBe(0);
    });

    it("returns 0 when no losing trades", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: 200, status: "closed" },
      ];
      expect(calculateAverageLoss(trades)).toBe(0);
    });

    it("returns positive number for average loss", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: -50, status: "closed" },
        { pnl: -150, status: "closed" },
      ];
      // abs(-50 + -150) / 2 = 100
      expect(calculateAverageLoss(trades)).toBe(100);
    });

    it("ignores open trades", () => {
      const trades: TradeData[] = [
        { pnl: -100, status: "closed" },
        { pnl: -500, status: "open" },
      ];
      expect(calculateAverageLoss(trades)).toBe(100);
    });
  });

  describe("calculateEquityCurve", () => {
    it("returns empty array for no data", () => {
      expect(calculateEquityCurve([])).toEqual([]);
    });

    it("calculates cumulative equity correctly", () => {
      const metrics: DailyMetricData[] = [
        { date: "2024-01-01", pnl: 100, trades: 5, winRate: 0.6, avgWin: 50, avgLoss: 30 },
        { date: "2024-01-02", pnl: -50, trades: 3, winRate: 0.33, avgWin: 40, avgLoss: 60 },
        { date: "2024-01-03", pnl: 200, trades: 4, winRate: 0.75, avgWin: 80, avgLoss: 20 },
      ];
      const result = calculateEquityCurve(metrics);
      expect(result).toEqual([
        { date: "2024-01-01", equity: 100 },
        { date: "2024-01-02", equity: 50 },
        { date: "2024-01-03", equity: 250 },
      ]);
    });

    it("sorts by date", () => {
      const metrics: DailyMetricData[] = [
        { date: "2024-01-03", pnl: 200, trades: 4, winRate: 0.75, avgWin: 80, avgLoss: 20 },
        { date: "2024-01-01", pnl: 100, trades: 5, winRate: 0.6, avgWin: 50, avgLoss: 30 },
        { date: "2024-01-02", pnl: -50, trades: 3, winRate: 0.33, avgWin: 40, avgLoss: 60 },
      ];
      const result = calculateEquityCurve(metrics);
      expect(result[0].date).toBe("2024-01-01");
      expect(result[1].date).toBe("2024-01-02");
      expect(result[2].date).toBe("2024-01-03");
    });
  });

  describe("aggregateMetrics", () => {
    it("returns zeros for empty data", () => {
      const result = aggregateMetrics([], []);
      expect(result.totalPnl).toBe(0);
      expect(result.totalTrades).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.profitFactor).toBe(0);
      expect(result.maxDrawdown).toBe(0);
      expect(result.sharpeRatio).toBe(0);
      expect(result.averageWin).toBe(0);
      expect(result.averageLoss).toBe(0);
      expect(result.bestDay).toBe(0);
      expect(result.worstDay).toBe(0);
      expect(result.equityCurve).toEqual([]);
    });

    it("aggregates all metrics correctly", () => {
      const trades: TradeData[] = [
        { pnl: 100, status: "closed" },
        { pnl: -50, status: "closed" },
        { pnl: 200, status: "closed" },
        { pnl: -30, status: "closed" },
        { pnl: null, status: "open" },
      ];
      const dailyMetrics: DailyMetricData[] = [
        { date: "2024-01-01", pnl: 100, trades: 2, winRate: 0.5, avgWin: 100, avgLoss: 50 },
        { date: "2024-01-02", pnl: -80, trades: 2, winRate: 0.5, avgWin: 200, avgLoss: 30 },
        { date: "2024-01-03", pnl: 200, trades: 1, winRate: 1.0, avgWin: 200, avgLoss: 0 },
      ];

      const result = aggregateMetrics(trades, dailyMetrics);

      expect(result.totalPnl).toBe(220); // 100 - 80 + 200
      expect(result.totalTrades).toBe(4); // 4 closed trades
      expect(result.winRate).toBe(0.5); // 2 wins out of 4 closed
      expect(result.bestDay).toBe(200);
      expect(result.worstDay).toBe(-80);
      expect(result.equityCurve).toHaveLength(3);
      expect(result.equityCurve[2].equity).toBe(220);
      expect(result.maxDrawdown).toBe(80); // peak 100, drops to 20
    });
  });
});
