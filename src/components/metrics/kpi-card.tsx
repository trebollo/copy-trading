"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  href?: string;
}

function AnimatedNumber({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    // Try to parse numeric value from the string (handles "$1,234.56" or "142")
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    const numericValue = parseFloat(cleaned);

    if (isNaN(numericValue) || numericValue === 0) {
      setDisplayValue(value);
      return;
    }

    hasAnimated.current = true;

    const prefix = value.match(/^[^0-9\-]*/)?.[0] || "";
    const suffix = value.match(/[^0-9.]*$/)?.[0] || "";
    const hasDecimals = value.includes(".");
    const isNegative = numericValue < 0;
    const absValue = Math.abs(numericValue);

    const duration = 1.5;
    const startTime = performance.now();

    function tick() {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentNum = eased * absValue;

      let formatted: string;
      if (hasDecimals) {
        formatted = currentNum.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      } else {
        formatted = Math.round(currentNum).toLocaleString("en-US");
      }

      const sign = isNegative ? "-" : "";
      setDisplayValue(`${sign}${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Set final value exactly
        setDisplayValue(value);
      }
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{displayValue}</span>;
}

export function KpiCard({ label, value, trend, trendValue, icon, href }: KpiCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-red-500"
        : "text-muted-foreground";

  const cardContent = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full relative overflow-hidden",
          "backdrop-blur-xl bg-card/80 border-border/50",
          "shadow-sm hover:shadow-lg transition-shadow duration-300",
          href && "cursor-pointer"
        )}
      >
        {/* Subtle gradient accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {icon && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-sm scale-150" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                {icon}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold tracking-tight">
            <AnimatedNumber value={value} />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs mt-1", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
