"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User,
  Bell,
  Link2,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Loader2,
  Shield,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isDemoMode } from "@/lib/demo-mode";

interface NotificationSettings {
  tradeCopied: boolean;
  dailyReport: boolean;
  riskLimitHit: boolean;
}

interface Preferences {
  defaultRiskMultiplier: string;
  timezone: string;
}

interface TradovateCredentials {
  username: string;
  environment: "demo" | "live";
  connected: boolean;
  lastSync: string | null;
}

const TRADOVATE_CREDENTIALS_KEY = "tradovate-credentials";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState<NotificationSettings>({
    tradeCopied: true,
    dailyReport: true,
    riskLimitHit: true,
  });

  const [preferences, setPreferences] = useState<Preferences>({
    defaultRiskMultiplier: "1.0",
    timezone: "America/New_York",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const demo = isDemoMode();

  // Tradovate state
  const [tradovateUsername, setTradovateUsername] = useState("");
  const [tradovatePassword, setTradovatePassword] = useState("");
  const [tradovateEnvironment, setTradovateEnvironment] = useState<"demo" | "live">("demo");
  const [tradovateConnected, setTradovateConnected] = useState(false);
  const [tradovateLastSync, setTradovateLastSync] = useState<string | null>(null);
  const [tradovateConnecting, setTradovateConnecting] = useState(false);
  const [tradovateSaving, setTradovateSaving] = useState(false);

  const loadTradovateCredentials = useCallback(() => {
    try {
      const saved = localStorage.getItem(TRADOVATE_CREDENTIALS_KEY);
      if (saved) {
        const creds: TradovateCredentials = JSON.parse(saved);
        setTradovateUsername(creds.username || "");
        setTradovateEnvironment(creds.environment || "demo");
        setTradovateConnected(creds.connected || false);
        setTradovateLastSync(creds.lastSync || null);
      }
    } catch {
      // Use defaults
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const prefs = data.preferences;
        setNotifications({
          tradeCopied: prefs.notifyTradeCopied,
          dailyReport: prefs.notifyDailyReport,
          riskLimitHit: prefs.notifyRiskLimitHit,
        });
        setPreferences({
          defaultRiskMultiplier: String(prefs.defaultRiskMultiplier),
          timezone: prefs.timezone,
        });
      } else {
        // Fallback: load from localStorage
        const saved = localStorage.getItem("copy-trading-settings");
        if (saved) {
          const prefs = JSON.parse(saved);
          setNotifications({
            tradeCopied: prefs.notifyTradeCopied ?? true,
            dailyReport: prefs.notifyDailyReport ?? true,
            riskLimitHit: prefs.notifyRiskLimitHit ?? true,
          });
          setPreferences({
            defaultRiskMultiplier: String(prefs.defaultRiskMultiplier ?? 1.0),
            timezone: prefs.timezone ?? "America/New_York",
          });
        }
      }
    } catch {
      // Fallback: load from localStorage
      const saved = localStorage.getItem("copy-trading-settings");
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          setNotifications({
            tradeCopied: prefs.notifyTradeCopied ?? true,
            dailyReport: prefs.notifyDailyReport ?? true,
            riskLimitHit: prefs.notifyRiskLimitHit ?? true,
          });
          setPreferences({
            defaultRiskMultiplier: String(prefs.defaultRiskMultiplier ?? 1.0),
            timezone: prefs.timezone ?? "America/New_York",
          });
        } catch {
          // Use defaults
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
    loadTradovateCredentials();
  }, [loadPreferences, loadTradovateCredentials]);

  const savePreferences = async () => {
    setIsSaving(true);
    const settingsData = {
      defaultRiskMultiplier: parseFloat(preferences.defaultRiskMultiplier) || 1.0,
      timezone: preferences.timezone,
      notifyTradeCopied: notifications.tradeCopied,
      notifyDailyReport: notifications.dailyReport,
      notifyRiskLimitHit: notifications.riskLimitHit,
    };

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        // Fallback to localStorage in demo mode
        localStorage.setItem("copy-trading-settings", JSON.stringify(settingsData));
        toast.success("Settings saved locally");
      }
    } catch {
      // Fallback to localStorage when API is unavailable
      localStorage.setItem("copy-trading-settings", JSON.stringify(settingsData));
      toast.success("Settings saved locally");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTradovateTestConnection = async () => {
    if (!tradovateUsername.trim() || !tradovatePassword.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setTradovateConnecting(true);
    try {
      const response = await fetch("/api/tradovate/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: tradovateUsername.trim(),
          password: tradovatePassword.trim(),
          environment: tradovateEnvironment,
        }),
      });

      if (response.ok) {
        const now = new Date().toLocaleString();
        setTradovateConnected(true);
        setTradovateLastSync(now);

        // Save connection state to localStorage (without password)
        const creds: TradovateCredentials = {
          username: tradovateUsername.trim(),
          environment: tradovateEnvironment,
          connected: true,
          lastSync: now,
        };
        localStorage.setItem(TRADOVATE_CREDENTIALS_KEY, JSON.stringify(creds));
        toast.success("Tradovate connected successfully! All accounts under this login are now accessible.");
      } else {
        const errorData = await response.json();
        setTradovateConnected(false);
        toast.error(`Connection failed: ${errorData.error || "Invalid credentials"}`);
      }
    } catch {
      toast.error("Unable to reach Tradovate. Please check your network and try again.");
    } finally {
      setTradovateConnecting(false);
    }
  };

  const handleTradovateSaveCredentials = () => {
    if (!tradovateUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setTradovateSaving(true);
    try {
      const creds: TradovateCredentials = {
        username: tradovateUsername.trim(),
        environment: tradovateEnvironment,
        connected: tradovateConnected,
        lastSync: tradovateLastSync,
      };
      localStorage.setItem(TRADOVATE_CREDENTIALS_KEY, JSON.stringify(creds));
      toast.success("Tradovate credentials saved");
    } catch {
      toast.error("Failed to save credentials");
    } finally {
      setTradovateSaving(false);
    }
  };

  const handleTradovateDisconnect = () => {
    setTradovateUsername("");
    setTradovatePassword("");
    setTradovateConnected(false);
    setTradovateLastSync(null);
    setTradovateEnvironment("demo");
    localStorage.removeItem(TRADOVATE_CREDENTIALS_KEY);
    toast.success("Tradovate disconnected. Credentials cleared.");
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreferenceChange = (key: keyof Preferences, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account preferences and platform connections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <section aria-labelledby="profile-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 id="profile-heading" className="text-lg font-semibold">Profile</h3>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={session?.user?.image ?? ""}
              alt={session?.user?.name ?? "User avatar"}
            />
            <AvatarFallback className="text-lg">
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-medium">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-sm text-muted-foreground">
              {session?.user?.email ?? "email@example.com"}
            </p>
            <p className="text-xs text-muted-foreground">
              Signed in with Google
            </p>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section aria-labelledby="notifications-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 id="notifications-heading" className="text-lg font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trade Copied</p>
              <p className="text-sm text-muted-foreground">
                Get notified when a trade is successfully copied
              </p>
            </div>
            <Switch
              checked={notifications.tradeCopied}
              onCheckedChange={() => handleNotificationChange("tradeCopied")}
              aria-label="Toggle trade copied notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Report</p>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of your trading activity
              </p>
            </div>
            <Switch
              checked={notifications.dailyReport}
              onCheckedChange={() => handleNotificationChange("dailyReport")}
              aria-label="Toggle daily report notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Risk Limit Hit</p>
              <p className="text-sm text-muted-foreground">
                Alert when an account reaches its risk limit
              </p>
            </div>
            <Switch
              checked={notifications.riskLimitHit}
              onCheckedChange={() => handleNotificationChange("riskLimitHit")}
              aria-label="Toggle risk limit hit notifications"
            />
          </div>
        </div>
      </section>

      {/* Tradovate API Configuration Section */}
      <section aria-labelledby="tradovate-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h3 id="tradovate-heading" className="text-lg font-semibold">Tradovate API Configuration</h3>
          </div>
          <div className="flex items-center gap-2">
            {tradovateConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" aria-hidden="true" />
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Badge variant="outline" className="text-muted-foreground">
                  Disconnected
                </Badge>
              </>
            )}
          </div>
        </div>

        {tradovateConnected && tradovateLastSync && (
          <p className="text-xs text-muted-foreground mb-4">
            Last sync: {tradovateLastSync}
          </p>
        )}

        {/* Environment Toggle */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Environment</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tradovate-environment"
                  value="demo"
                  checked={tradovateEnvironment === "demo"}
                  onChange={() => setTradovateEnvironment("demo")}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Demo</span>
                <Badge variant="secondary" className="text-xs">Free</Badge>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tradovate-environment"
                  value="live"
                  checked={tradovateEnvironment === "live"}
                  onChange={() => setTradovateEnvironment("live")}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Live</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tradovateEnvironment === "demo"
                ? "Demo: https://demo.tradovateapi.com/v1 (free, no market data subscription required)"
                : "Live: https://live.tradovateapi.com/v1 (requires Tradovate subscription for market data)"}
            </p>
          </div>

          {/* Credentials Fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tradovate-username">
                Username
              </label>
              <Input
                id="tradovate-username"
                value={tradovateUsername}
                onChange={(e) => setTradovateUsername(e.target.value)}
                placeholder="Your Tradovate username"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tradovate-password">
                Password
              </label>
              <Input
                id="tradovate-password"
                type="password"
                value={tradovatePassword}
                onChange={(e) => setTradovatePassword(e.target.value)}
                placeholder={tradovateConnected ? "********" : "Your Tradovate password"}
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground">
                Password is only used during connection and is not stored.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleTradovateTestConnection}
              disabled={tradovateConnecting || !tradovateUsername.trim() || !tradovatePassword.trim()}
            >
              {tradovateConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {tradovateConnecting ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTradovateSaveCredentials}
              disabled={tradovateSaving || !tradovateUsername.trim()}
            >
              {tradovateSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Save Credentials
            </Button>
            {tradovateConnected && (
              <Button
                variant="destructive"
                onClick={handleTradovateDisconnect}
              >
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Disconnect
              </Button>
            )}
          </div>

          {/* Info Card */}
          <div className="rounded-md border bg-muted/50 p-4 mt-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Multi-account access:</strong> Your Tradovate credentials give access to all accounts under your login, including prop firm accounts (Apex, TopStep, etc.).
                </p>
                <p>
                  <strong>Free demo:</strong> Demo environment is completely free. Create an account at{" "}
                  <a
                    href="https://trader.tradovate.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    trader.tradovate.com
                  </a>
                </p>
                <p>
                  <strong>Live environment:</strong> Requires a Tradovate subscription for market data ($0 for order execution only).
                </p>
                <p>
                  <strong>Safe with prop firms:</strong> This uses the official Tradovate API, the same as any other connected platform (Sierra Chart, TradingView, etc.). Prop firms cannot distinguish API access from platform access.
                </p>
                <p>
                  <strong>No API key needed:</strong> Just your Tradovate username and password. The appId is just a label used internally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Platforms (Coming Soon) */}
      <section aria-labelledby="other-platforms-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 id="other-platforms-heading" className="text-lg font-semibold">Other Platforms</h3>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">NinjaTrader</p>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Not yet available</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="Connect NinjaTrader (coming soon)"
            >
              <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Connect
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Rithmic</p>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Not yet available</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="Connect Rithmic (coming soon)"
            >
              <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Connect
            </Button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section aria-labelledby="preferences-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 id="preferences-heading" className="text-lg font-semibold">Preferences</h3>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Default Risk Multiplier</p>
              <p className="text-sm text-muted-foreground">
                Applied to new accounts added to copy groups
              </p>
            </div>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={preferences.defaultRiskMultiplier}
              onChange={(e) =>
                handlePreferenceChange("defaultRiskMultiplier", e.target.value)
              }
              className="w-24"
              aria-label="Default risk multiplier"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Preferred Timezone</p>
              <p className="text-sm text-muted-foreground">
                Used for displaying trade times and daily reports
              </p>
            </div>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                handlePreferenceChange("timezone", e.target.value)
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Preferred timezone"
            >
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Central Europe (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Toggle dark color scheme
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
