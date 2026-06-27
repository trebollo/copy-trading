"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface DailyMetricData {
  date: string;
  pnl: number;
  trades: number;
}

interface AccountPnlChartProps {
  data: DailyMetricData[];
}

export function AccountPnlChart({ data }: AccountPnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No daily metrics available. PnL data will appear after syncing trades.
      </div>
    );
  }

  const cumulativeData = data.reduce<
    Array<{ date: string; pnl: number; cumulative: number }>
  >((acc, item) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({
      date: item.date,
      pnl: item.pnl,
      cumulative: prev + item.pnl,
    });
    return acc;
  }, []);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={cumulativeData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value, "MMM dd")}
            className="text-xs"
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "PnL"]}
            labelFormatter={(label) => formatDate(label, "MMM dd, yyyy")}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
