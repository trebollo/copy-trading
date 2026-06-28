"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export interface PnlCalendarData {
  date: string;
  pnl: number;
  trades: number;
}

interface PnlCalendarProps {
  data: PnlCalendarData[];
}

function getPnlColor(pnl: number, maxAbsPnl: number): string {
  if (pnl === 0) return "bg-muted";
  const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);

  if (pnl > 0) {
    if (intensity < 0.33) return "bg-green-200 dark:bg-green-900/40";
    if (intensity < 0.66) return "bg-green-400 dark:bg-green-700/60";
    return "bg-green-600 dark:bg-green-500/80";
  } else {
    if (intensity < 0.33) return "bg-red-200 dark:bg-red-900/40";
    if (intensity < 0.66) return "bg-red-400 dark:bg-red-700/60";
    return "bg-red-600 dark:bg-red-500/80";
  }
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PnlCalendar({ data }: PnlCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Default to the month of the first data point, or now
    if (data.length > 0) {
      return startOfMonth(parseISO(data[0].date));
    }
    return startOfMonth(new Date());
  });
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dataMap = useMemo(() => {
    const map = new Map<string, PnlCalendarData>();
    for (const d of data) {
      map.set(d.date, d);
    }
    return map;
  }, [data]);

  const maxAbsPnl = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => Math.abs(d.pnl)), 1);
  }, [data]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // getDay returns 0=Sunday, 1=Monday... We want Monday=0
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {daysInMonth.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayData = dataMap.get(dateStr);
          const colorClass = dayData
            ? getPnlColor(dayData.pnl, maxAbsPnl)
            : "bg-muted/50";
          const isHovered = hoveredDay === dateStr;

          return (
            <div
              key={dateStr}
              className="relative"
              onMouseEnter={() => setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium cursor-default transition-transform ${colorClass} ${
                  isHovered ? "ring-2 ring-primary scale-110 z-10" : ""
                } ${dayData && dayData.pnl > 0 ? "text-green-950 dark:text-green-100" : ""} ${dayData && dayData.pnl < 0 ? "text-red-950 dark:text-red-100" : "text-muted-foreground"}`}
              >
                {format(day, "d")}
              </div>

              {/* Tooltip */}
              {isHovered && dayData && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <div className="bg-popover border border-border rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap">
                    <p className="font-semibold">{format(day, "MMM d, yyyy")}</p>
                    <p className={dayData.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                      PnL: {formatCurrency(dayData.pnl)}
                    </p>
                    <p className="text-muted-foreground">
                      Trades: {dayData.trades}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Loss</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-red-600 dark:bg-red-500/80" />
          <div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-700/60" />
          <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/40" />
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500/80" />
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}
