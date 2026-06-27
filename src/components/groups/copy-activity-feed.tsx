"use client";

import { ArrowRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export interface CopyActivityEvent {
  id: string;
  masterAccountName: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  followerResults: {
    accountName: string;
    adjustedQuantity: number;
    success: boolean;
    reason?: string;
  }[];
  timestamp: string;
}

interface CopyActivityFeedProps {
  events: CopyActivityEvent[];
}

const statusIcon = (success: boolean) => {
  if (success) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
};

export function CopyActivityFeed({ events }: CopyActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No copy activity yet</p>
        <p className="text-xs text-muted-foreground">
          Activity will appear here when the master account places trades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={event.side === "buy" ? "default" : "destructive"}>
                {event.side.toUpperCase()}
              </Badge>
              <span className="font-medium text-sm">{event.symbol}</span>
              <span className="text-xs text-muted-foreground">
                x{event.quantity}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(event.timestamp, "MMM dd, HH:mm:ss")}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium">{event.masterAccountName}</span>
            <ArrowRight className="h-3 w-3" />
            <span>
              {event.followerResults.length} follower
              {event.followerResults.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-1">
            {event.followerResults.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs pl-2"
              >
                <div className="flex items-center gap-1.5">
                  {statusIcon(result.success)}
                  <span>{result.accountName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <span className="text-muted-foreground">
                      x{result.adjustedQuantity}
                    </span>
                  ) : (
                    <span className="text-destructive text-xs">
                      {result.reason || "Failed"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
