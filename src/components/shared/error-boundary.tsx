"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button
        onClick={reset}
        variant="outline"
        className="mt-2"
        aria-label="Retry loading the page"
      >
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        Try Again
      </Button>
    </div>
  );
}
