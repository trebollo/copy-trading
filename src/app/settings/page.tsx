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
  XCircle,
  RefreshCw,
  Save,
  Loader2,
  Shield,
  Info,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isDemoMode } from "@/lib/demo-mode";
import {
  TradovateConnection,
  getConnections,
  addConnection,
  updateConnection,
  removeConnection,
} from "@/lib/trading/connection-store";

interface NotificationSettings {
  tradeCopied: boolean;
  dailyReport: boolean;
  riskLimitHit: boolean;
}

interface Preferences {
  defaultRiskMultiplier: string;
  timezone: string;
}

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
  const _demo = isDemoMode();

  // Connection management state
  const [connections, setConnections] = useState<TradovateConnection[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<TradovateConnection | null>(null);
  const [dialogLabel, setDialogLabel] = useState("");
  const [dialogUsername, setDialogUsername] = useState("");
  const [dialogPassword, setDialogPassword] = useState("");
  const [dialogEnvironment, setDialogEnvironment] = useState<"demo" | "live">(
    "demo"
  );
  const [dialogConnecting, setDialogConnecting] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const loadConnections = useCallback(() => {
    setConnections(getConnections());
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
    loadConnections();
  }, [loadPreferences, loadConnections]);

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
        localStorage.setItem("copy-trading-settings", JSON.stringify(settingsData));
        toast.success("Settings saved locally");
      }
    } catch {
      localStorage.setItem("copy-trading-settings", JSON.stringify(settingsData));
      toast.success("Settings saved locally");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Connection Dialog Handlers ---

  const openAddDialog = () => {
    setEditingConnection(null);
    setDialogLabel("");
    setDialogUsername("");
    setDialogPassword("");
    setDialogEnvironment("demo");
    setDialogError("");
    setDialogOpen(true);
  };

  const openEditDialog = (conn: TradovateConnection) => {
    setEditingConnection(conn);
    setDialogLabel(conn.label);
    setDialogUsername(conn.username);
    setDialogPassword("");
    setDialogEnvironment(conn.environment);
    setDialogError("");
    setDialogOpen(true);
  };

  const handleTestAndConnect = async () => {
    if (!dialogLabel.trim()) {
      setDialogError("Please enter a label for this connection");
      return;
    }
    if (!dialogUsername.trim()) {
      setDialogError("Please enter a username");
      return;
    }
    if (!dialogPassword.trim()) {
      setDialogError("Please enter a password");
      return;
    }

    setDialogConnecting(true);
    setDialogError("");

    try {
      const response = await fetch("/api/tradovate/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: dialogUsername.trim(),
          password: dialogPassword.trim(),
          environment: dialogEnvironment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDialogError(errorData.error || "Authentication failed");
        setDialogConnecting(false);
        return;
      }

      const data = await response.json();
      const accounts = data.accounts || [];
      const debugMessages = data.debug || [];
      const now = new Date().toISOString();

      if (editingConnection) {
        updateConnection(editingConnection.id, {
          label: dialogLabel.trim(),
          username: dialogUsername.trim(),
          environment: dialogEnvironment,
          status: "connected",
          lastSync: now,
          accounts,
          debug: debugMessages,
        });
      } else {
        addConnection({
          label: dialogLabel.trim(),
          username: dialogUsername.trim(),
          environment: dialogEnvironment,
          status: "connected",
          lastSync: now,
          accounts,
          debug: debugMessages,
        });
      }

      loadConnections();
      setDialogOpen(false);

      // Show a single informative toast
      if (accounts.length > 0) {
        toast.success(`"${dialogLabel.trim()}" connected — ${accounts.length} account${accounts.length > 1 ? "s" : ""} found`);
      } else {
        // Show debug info prominently when no accounts found
        toast.warning(
          `"${dialogLabel.trim()}" connected but no accounts detected.\n${debugMessages.join("\n")}`,
          { duration: 10000 }
        );
      }
    } catch {
      setDialogError(
        "Unable to reach Tradovate. Please check your network and try again."
      );
    } finally {
      setDialogConnecting(false);
    }
  };

  const handleReconnect = async (conn: TradovateConnection) => {
    // Open edit dialog so user can re-enter password
    openEditDialog(conn);
  };

  const handleRefreshAccounts = (conn: TradovateConnection) => {
    // Open edit dialog in refresh mode — user re-enters password, clicks "Test & Connect"
    // which already fetches and updates accounts
    setEditingConnection(conn);
    setDialogLabel(conn.label);
    setDialogUsername(conn.username);
    setDialogPassword("");
    setDialogEnvironment(conn.environment);
    setDialogError("");
    setDialogOpen(true);
    toast.info("Enter your password and click \"Test & Connect\" to refresh accounts.");
  };

  const handleRemoveConnection = (conn: TradovateConnection) => {
    removeConnection(conn.id);
    loadConnections();
    toast.success(`"${conn.label}" removed`);
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreferenceChange = (key: keyof Preferences, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusDot = (status: TradovateConnection["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
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

      {/* Tradovate Connections Section */}
      <section aria-labelledby="tradovate-heading" className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h3 id="tradovate-heading" className="text-lg font-semibold">
              Tradovate Connections
            </h3>
          </div>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Connection
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Manage connections for each prop firm account
        </p>

        {/* Connection Cards */}
        {connections.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No connections yet. Add a connection to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <Card key={conn.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${getStatusDot(conn.status)}`}
                        aria-label={`Status: ${conn.status}`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{conn.label}</p>
                          <Badge
                            variant={
                              conn.environment === "live"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {conn.environment === "live" ? "Live" : "Demo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {conn.username}
                        </p>
                        {conn.accounts.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conn.accounts.map((acc) => (
                              <Badge
                                key={acc.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {acc.name}
                              </Badge>
                            ))}
                          </div>
                        ) : conn.status === "connected" ? (
                          <div className="mt-1">
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              No accounts detected — try Refresh
                            </p>
                            {conn.debug && conn.debug.length > 0 && (
                              <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                                {conn.debug.map((msg, i) => (
                                  <p key={i}>{msg}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconnect(conn)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        Reconnect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshAccounts(conn)}
                        aria-label={`Refresh accounts for ${conn.label}`}
                        title="Refresh accounts (re-enter password)"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(conn)}
                        aria-label={`Edit ${conn.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveConnection(conn)}
                        aria-label={`Remove ${conn.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="rounded-md border bg-muted/50 p-4 mt-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p>
                Each prop firm provides separate Tradovate credentials. Add one
                connection per prop firm to manage all accounts.
              </p>
              <p>
                Demo environment is free — no subscription needed.
              </p>
              <p>
                One connection discovers all accounts under that login.
              </p>
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

      {/* Add/Edit Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? "Edit Connection" : "Add Connection"}
            </DialogTitle>
            <DialogDescription>
              {editingConnection
                ? "Update connection details and re-enter password to reconnect."
                : "Connect a prop firm account by entering your Tradovate credentials."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="conn-label">
                Label
              </label>
              <Input
                id="conn-label"
                value={dialogLabel}
                onChange={(e) => setDialogLabel(e.target.value)}
                placeholder="e.g., Apex Funded"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="conn-username">
                Username
              </label>
              <Input
                id="conn-username"
                value={dialogUsername}
                onChange={(e) => setDialogUsername(e.target.value)}
                placeholder="Tradovate username"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="conn-password">
                Password
              </label>
              <Input
                id="conn-password"
                type="password"
                value={dialogPassword}
                onChange={(e) => setDialogPassword(e.target.value)}
                placeholder="Tradovate password"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <Select
                value={dialogEnvironment}
                onValueChange={(val) =>
                  setDialogEnvironment(val as "demo" | "live")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dialogError && (
              <p className="text-sm text-destructive">{dialogError}</p>
            )}

            <Button
              className="w-full"
              onClick={handleTestAndConnect}
              disabled={dialogConnecting}
            >
              {dialogConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {dialogConnecting ? "Connecting..." : "Test & Connect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
