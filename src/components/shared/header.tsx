"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search, LogOut, User, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: "trade" | "report" | "alert";
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    title: "Trade copied successfully",
    description: "ES buy 2 lots copied to TopStep 150K",
    time: "2 min ago",
    read: false,
    icon: "trade",
  },
  {
    id: "n2",
    title: "Daily report available",
    description: "Your trading summary for today is ready",
    time: "1 hour ago",
    read: false,
    icon: "report",
  },
  {
    id: "n3",
    title: "Risk limit warning",
    description: "NinjaTrader Eval approaching daily loss limit",
    time: "3 hours ago",
    read: true,
    icon: "alert",
  },
  {
    id: "n4",
    title: "Trade copied successfully",
    description: "NQ sell 1 lot copied to 2 accounts",
    time: "5 hours ago",
    read: true,
    icon: "trade",
  },
];

const notificationIcons = {
  trade: TrendingUp,
  report: FileText,
  alert: AlertTriangle,
};

export function Header() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [searchValue, setSearchValue] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      toast.info(`Searching for "${searchValue.trim()}"...`);
    }
  };

  return (
    <header
      className="flex h-14 md:h-16 items-center justify-between border-b bg-card px-4 md:px-6"
      role="banner"
    >
      <div className="hidden sm:flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search..."
            className="w-48 md:w-64 pl-8"
            aria-label="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" aria-label="New notifications" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.icon];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                    notification.icon === "alert" ? "text-amber-500" :
                    notification.icon === "trade" ? "text-green-500" :
                    "text-blue-500"
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm leading-none ${!notification.read ? "font-medium" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image ?? ""}
                  alt={session?.user?.name ?? "User"}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) ?? <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
