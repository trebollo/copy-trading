import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="w-full max-w-7xl">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
