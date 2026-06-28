"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
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

function getPnlTextColor(pnl: number): string {
  if (pnl > 0) return "text-green-700 dark:text-green-300";
  if (pnl < 0) return "text-red-700 dark:text-red-300";
  return "text-muted-foreground";
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Week Total"];

export function PnlCalendar({ data }: PnlCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (data.length > 0) {
      return startOfMonth(parseISO(data[0].date));
    }
    return startOfMonth(new Date());
  });

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

  // Build weeks: each week is an array of 7 slots (some may be null for padding)
  const weeks: Array<Array<Date | null>> = [];
  let currentWeek: Array<Date | null> = Array.from({ length: startDayOfWeek }, () => null);

  for (const day of daysInMonth) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  // Fill the last week with nulls if incomplete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

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
      <div className="grid grid-cols-8 gap-1 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - row by row with weekly totals */}
      {weeks.map((week, weekIdx) => {
        // Calculate weekly totals
        let weekPnl = 0;
        let weekTrades = 0;
        for (const day of week) {
          if (day) {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayData = dataMap.get(dateStr);
            if (dayData) {
              weekPnl += dayData.pnl;
              weekTrades += dayData.trades;
            }
          }
        }

        return (
          <div key={weekIdx} className="grid grid-cols-8 gap-1 mb-1">
            {/* Day cells */}
            {week.map((day, dayIdx) => {
              if (!day) {
                return <div key={`empty-${weekIdx}-${dayIdx}`} className="min-h-[4rem]" />;
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = dataMap.get(dateStr);
              const colorClass = dayData
                ? getPnlColor(dayData.pnl, maxAbsPnl)
                : "bg-muted/50";
              const textColorClass = dayData
                ? getPnlTextColor(dayData.pnl)
                : "text-muted-foreground";
              const isClickable = dayData && dayData.trades > 0;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[4rem] rounded-sm flex flex-col justify-between p-1 text-xs transition-transform ${colorClass} ${textColorClass} ${isClickable ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary/50" : "cursor-default"}`}
                  onClick={() => {
                    if (isClickable) {
                      router.push(`/trades?date=${dateStr}`);
                    }
                  }}
                >
                  {/* Day number - top left */}
                  <span className="text-[10px] leading-none font-medium">
                    {format(day, "d")}
                  </span>
                  {/* PnL - center */}
                  {dayData && dayData.pnl !== 0 ? (
                    <span className="text-[11px] font-semibold text-center leading-tight">
                      {formatCurrency(dayData.pnl)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-center leading-tight">&nbsp;</span>
                  )}
                  {/* Trade count - bottom */}
                  {dayData && dayData.trades > 0 ? (
                    <span className="text-[10px] text-center leading-none opacity-75">
                      {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-[10px] text-center leading-none">&nbsp;</span>
                  )}
                </div>
              );
            })}

            {/* Weekly total cell */}
            <div
              className={`min-h-[4rem] rounded-sm flex flex-col items-center justify-center p-1 text-xs border ${
                weekPnl > 0
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                  : weekPnl < 0
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                    : "bg-muted/50 text-muted-foreground border-border"
              }`}
            >
              <span className="text-[11px] font-bold leading-tight">
                {formatCurrency(weekPnl)}
              </span>
              {weekTrades > 0 && (
                <span className="text-[10px] leading-none mt-1 opacity-75">
                  {weekTrades} trades
                </span>
              )}
            </div>
          </div>
        );
      })}

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
