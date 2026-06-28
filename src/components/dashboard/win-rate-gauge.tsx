"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface WinRateGaugeProps {
  value: number; // 0-1 range
}

function getColor(value: number): string {
  if (value > 0.6) return "#22c55e"; // green
  if (value >= 0.4) return "#eab308"; // yellow
  return "#ef4444"; // red
}

export function WinRateGauge({ value }: WinRateGaugeProps) {
  const percentage = Math.round(value * 100);
  const color = getColor(value);

  const data = [
    {
      name: "Win Rate",
      value: percentage,
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
            {percentage}%
          </motion.span>
          <span className="text-sm text-muted-foreground">Win Rate</span>
        </div>
      </div>
    </motion.div>
  );
}
