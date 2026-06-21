"use client";

import * as React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type INotification,
} from "@/lib/features/services/notifications.api";

/** Compact "2m / 3h / 4d ago" formatter. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name?: string | null): string {
  if (!name) return "•";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NotificationBell() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";

  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useGetNotificationsQuery(undefined, {
    // Light polling as a fallback if the socket ever drops.
    pollingInterval: 60_000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  const onClickItem = async (n: INotification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.actionUrl) {
      setOpen(false);
      router.push(`/${lang}${n.actionUrl}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
              variant="destructive"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,22rem)] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
        <Separator />

        <div className="max-h-[24rem] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onClickItem(n)}
                className={cn(
                  "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                  !n.isRead && "bg-accent/40",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {n.actor?.image && <AvatarImage src={n.actor.image} />}
                  <AvatarFallback className="text-xs">
                    {initials(n.actor?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  {n.body && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
