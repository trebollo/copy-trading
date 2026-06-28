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
import { formatDate } from "@/lib/utils";

export interface WinRateData {
  date: string;
  winRate: number;
}

interface WinRateChartProps {
  data: WinRateData[];
}

export function WinRateChart({ data }: WinRateChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No win rate data available yet.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value, "MMM dd")}
            className="text-xs"
          />
          <YAxis
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            className="text-xs"
            domain={[0, 1]}
          />
          <Tooltip
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Win Rate"]}
            labelFormatter={(label) => formatDate(label, "MMM dd, yyyy")}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
