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

export interface ProfitFactorData {
  date: string;
  profitFactor: number;
}

interface ProfitFactorChartProps {
  data: ProfitFactorData[];
}

export function ProfitFactorChart({ data }: ProfitFactorChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No profit factor data available yet.
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
            tickFormatter={(value) => value.toFixed(2)}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "Profit Factor"]}
            labelFormatter={(label) => formatDate(label, "MMM dd, yyyy")}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="profitFactor"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
