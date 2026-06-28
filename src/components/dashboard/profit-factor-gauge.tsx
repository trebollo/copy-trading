"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface ProfitFactorGaugeProps {
  value: number; // e.g. 2.15
}

function getColor(value: number): string {
  if (value > 1.5) return "#22c55e"; // green
  if (value >= 1.0) return "#eab308"; // yellow
  return "#ef4444"; // red
}

export function ProfitFactorGauge({ value }: ProfitFactorGaugeProps) {
  const color = getColor(value);
  // Normalize to 0-100 for the chart (cap at 3.0 as max reasonable profit factor)
  const normalizedValue = Math.min((value / 3.0) * 100, 100);

  const data = [
    {
      name: "Profit Factor",
      value: normalizedValue,
      fill: color,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative w-[200px] h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={18}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: "hsl(var(--muted))" }}
              animationDuration={1500}
              animationBegin={200}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-3xl font-bold"
            style={{ color }}
          >
            {value.toFixed(2)}x
          </motion.span>
          <span className="text-sm text-muted-foreground">Profit Factor</span>
        </div>
      </div>
    </motion.div>
  );
}
