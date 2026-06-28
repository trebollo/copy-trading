"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

export interface EquityCurveData {
  date: string;
  equity: number;
}

interface EquityCurveChartProps {
  data: EquityCurveData[];
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No equity data available yet.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.5}
              />
              <stop
                offset="50%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.15}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
            formatter={(value: number) => [formatCurrency(value), "Equity"]}
            labelFormatter={(label) => formatDate(label, "MMM dd, yyyy")}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#equityGradient)"
            animationBegin={300}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
