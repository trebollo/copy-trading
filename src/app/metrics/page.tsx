import { Metadata } from "next";
import { MetricsDashboard } from "@/components/metrics/metrics-dashboard";

export const metadata: Metadata = {
  title: "Metrics | Copy Trading",
  description: "Performance metrics and analytics for your trading accounts",
};

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
        <p className="text-muted-foreground">
          Performance analytics across your trading accounts.
        </p>
      </div>
      <MetricsDashboard />
    </div>
  );
}
