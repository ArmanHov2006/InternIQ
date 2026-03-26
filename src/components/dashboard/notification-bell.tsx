"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Sparkles, Target, Trophy } from "lucide-react";
import type { Application } from "@/types/database";
import { generateNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const relative = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))}h ago`;
  if (diff < 2 * day) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function NotificationBell() {
  const [apps, setApps] = useState<Application[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/applications", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await res.json()) as Application[] | { error?: string };
      if (res.ok) setApps(payload as Application[]);
    };
    void load();
  }, []);

  const notifications = useMemo(() => {
    const generated = generateNotifications(apps);
    return generated.map((notification) => ({
      ...notification,
      read: readIds.includes(notification.id),
    }));
  }, [apps, readIds]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const iconForType = (type: string) => {
    if (type === "milestone") return <Trophy className="h-3.5 w-3.5 text-amber-500" />;
    if (type === "tip") return <Sparkles className="h-3.5 w-3.5 text-blue-500" />;
    return <Target className="h-3.5 w-3.5 text-green-500" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] depth-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {notifications.length > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setReadIds(notifications.map((notification) => notification.id))}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">All caught up!</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="cursor-pointer items-start gap-3 py-3"
              onSelect={() => setReadIds((prev) => Array.from(new Set([...prev, notification.id])))}
              asChild
            >
              <Link href={notification.href ?? "#"}>
                <span className="mt-0.5">{iconForType(notification.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{relative(notification.createdAt)}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
