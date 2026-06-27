"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <ErrorBoundary error={error} reset={reset} />
    </div>
  );
}
