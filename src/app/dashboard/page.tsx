import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total PnL",
    value: "$12,450.00",
    change: "+12.5%",
    icon: DollarSign,
  },
  {
    title: "Active Accounts",
    value: "8",
    change: "+2",
    icon: Wallet,
  },
  {
    title: "Active Groups",
    value: "3",
    change: "+1",
    icon: Users,
  },
  {
    title: "Today's Trades",
    value: "24",
    change: "+5",
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your trading activity and performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
