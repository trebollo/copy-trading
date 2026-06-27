"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: string;
  to: string;
};

type PresetKey = "today" | "7d" | "30d" | "90d" | "ytd" | "all";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function getPresetRange(preset: PresetKey): DateRange {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      return { from: to, to };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString().split("T")[0], to };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: from.toISOString().split("T")[0], to };
    }
    case "90d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: from.toISOString().split("T")[0], to };
    }
    case "ytd": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.toISOString().split("T")[0], to };
    }
    case "all": {
      return { from: "", to: "" };
    }
  }
}

const presets: Array<{ key: PresetKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetKey | null>("all");

  const handlePresetClick = (preset: PresetKey) => {
    setActivePreset(preset);
    onChange(getPresetRange(preset));
  };

  const handleCustomChange = (field: "from" | "to", dateValue: string) => {
    setActivePreset(null);
    onChange({ ...value, [field]: dateValue });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            variant={activePreset === preset.key ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.key)}
            className={cn(
              "text-xs",
              activePreset === preset.key && "pointer-events-none"
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={value.from}
          onChange={(e) => handleCustomChange("from", e.target.value)}
          className="h-8 w-36 text-xs"
          placeholder="From"
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => handleCustomChange("to", e.target.value)}
          className="h-8 w-36 text-xs"
          placeholder="To"
        />
      </div>
    </div>
  );
}
