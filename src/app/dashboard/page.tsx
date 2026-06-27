import { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard | Copy Trading",
  description: "Overview of your trading activity and performance",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your trading activity and performance.
        </p>
      </div>
      <DashboardOverview />
    </div>
  );
}
