"use client";

import { signIn } from "next-auth/react";
import { TrendingUp, BarChart3, Users, Shield, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LandingPageProps {
  demoMode?: boolean;
}

export function LandingPage({ demoMode }: LandingPageProps) {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 flex items-center justify-center gap-2">
          <TrendingUp className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">CopyTrader</h1>
        </div>

        <p className="mb-12 text-xl text-muted-foreground">
          Manage your funded trading accounts, create copy groups, and track
          performance metrics across multiple platforms.
        </p>

        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Copy Groups</CardTitle>
              <CardDescription>
                Define master accounts and configure followers with custom risk settings.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Live Metrics</CardTitle>
              <CardDescription>
                Track PnL, win rates, and performance across all your accounts in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Risk Management</CardTitle>
              <CardDescription>
                Set risk multipliers, max lots, and daily loss limits per account.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-3">
          {!demoMode && (
            <Button size="lg" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              Sign in with Google
            </Button>
          )}

          {demoMode && (
            <>
              <Button size="lg" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                Sign in with Google
              </Button>
              <p className="text-sm text-muted-foreground">
                Google sign-in requires configuration of OAuth credentials.
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => signIn("demo", { callbackUrl: "/dashboard" })}
              >
                <Play className="mr-2 h-4 w-4" />
                Enter Demo Mode
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
