"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface DailyPnlData {
  date: string;
  pnl: number;
}

interface DailyPnlChartProps {
  data: DailyPnlData[];
}

export function DailyPnlChart({ data }: DailyPnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No daily PnL data available yet.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
