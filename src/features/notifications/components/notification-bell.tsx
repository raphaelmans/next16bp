"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/trpc/client";
import {
  getNotificationBellBadgeCount,
  getNotificationBellIconVariant,
  getNotificationBellPermissionLabel,
  getNotificationBellToggleDisabled,
  type NotificationBellIconVariant,
} from "../domain";
import {
  useModWebPush,
  useMutNotificationMarkAllAsRead,
  useMutNotificationMarkAsRead,
  useQueryNotificationInbox,
  useQueryNotificationUnreadCount,
} from "../hooks";
import {
  NotificationInbox,
  type NotificationInboxItem,
} from "./notification-inbox";

const bellIcons: Record<NotificationBellIconVariant, typeof Bell> = {
  bell: Bell,
  "bell-ring": BellRing,
  "bell-off": BellOff,
};

type Portal = "owner" | "player" | "admin";

export function NotificationBell({ portal }: { portal: Portal }) {
  const router = useRouter();
  const webPush = useModWebPush();
  const [open, setOpen] = React.useState(false);
  const [optimisticUnreadCount, setOptimisticUnreadCount] = React.useState<
    number | null
  >(null);
  const [optimisticReadIds, setOptimisticReadIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [optimisticMarkAll, setOptimisticMarkAll] = React.useState(false);
  const unreadCountQuery = useQueryNotificationUnreadCount();
  const notificationInboxQuery = useQueryNotificationInbox(
    { limit: 20, offset: 0 },
    { enabled: open },
  );
  const markAsReadMutation = useMutNotificationMarkAsRead();
  const markAllAsReadMutation = useMutNotificationMarkAllAsRead();
  const utils = trpc.useUtils();
  const prevServerUnreadCountRef = React.useRef<number | null>(null);

  const settingsHref =
    portal === "owner"
      ? `${appRoutes.owner.settings}${SETTINGS_SECTION_HASHES.browserNotifications}`
      : `${appRoutes.account.profile}${SETTINGS_SECTION_HASHES.browserNotifications}`;

  const onToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await webPush.enable();
        toast.success("Browser notifications enabled");
      } else {
        await webPush.disable();
        toast.success("Browser notifications disabled");
      }
    } catch (error) {
      toast.error("Could not update notifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const toggleDisabled = getNotificationBellToggleDisabled({
    busy: webPush.busy,
    supported: webPush.supported,
    isSecureContext: webPush.isSecureContext,
    configured: webPush.configured,
    permission: webPush.permission,
  });

  const checked = webPush.enabledOnThisDevice;
  const permissionLabel = getNotificationBellPermissionLabel({
    permission: webPush.permission,
    enabledOnThisDevice: checked,
  });

  const iconVariant = getNotificationBellIconVariant({
    enabledOnThisDevice: checked,
  });
  const BellIcon = bellIcons[iconVariant];
  const serverUnreadCount = unreadCountQuery.data?.count ?? 0;
  const unreadCount = optimisticUnreadCount ?? serverUnreadCount;
  const badgeCount = getNotificationBellBadgeCount(unreadCount);

  React.useEffect(() => {
    setOptimisticUnreadCount((prev) =>
      prev === null ? prev : serverUnreadCount,
    );
  }, [serverUnreadCount]);

  React.useEffect(() => {
    const prev = prevServerUnreadCountRef.current;
    prevServerUnreadCountRef.current = serverUnreadCount;
    if (prev !== null && serverUnreadCount > prev && open) {
      utils.userNotification.listMy.invalidate();
    }
  }, [serverUnreadCount, open, utils]);

  React.useEffect(() => {
    if (!open) {
      setOptimisticReadIds(new Set());
      setOptimisticMarkAll(false);
      setOptimisticUnreadCount(null);
    }
  }, [open]);

  const inboxItems = (notificationInboxQuery.data?.items ?? []).map((item) => {
    const isRead =
      optimisticMarkAll ||
      item.readAt !== null ||
      optimisticReadIds.has(item.id);
    return {
      ...item,
      readAt: isRead ? (item.readAt ?? new Date().toISOString()) : null,
    } satisfies NotificationInboxItem;
  });

  const hasUnreadInInbox = inboxItems.some((item) => !item.readAt);

  const markItemAsReadOptimistic = (itemId: string) => {
    setOptimisticReadIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    setOptimisticUnreadCount((prev) => Math.max(0, (prev ?? unreadCount) - 1));
  };

  const revertMarkItemAsRead = (itemId: string) => {
    setOptimisticReadIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setOptimisticUnreadCount((prev) => (prev ?? unreadCount) + 1);
  };

  const onNotificationClick = async (item: NotificationInboxItem) => {
    const wasRead = Boolean(item.readAt);
    if (!wasRead) {
      markItemAsReadOptimistic(item.id);
    }

    try {
      if (!wasRead) {
        await markAsReadMutation.mutateAsync({ id: item.id });
      }

      if (item.href) {
        setOpen(false);
        router.push(item.href);
      }
    } catch (error) {
      if (!wasRead) {
        revertMarkItemAsRead(item.id);
      }

      toast.error("Could not open notification", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onMarkItemAsRead = async (item: NotificationInboxItem) => {
    if (item.readAt) return;

    markItemAsReadOptimistic(item.id);

    try {
      await markAsReadMutation.mutateAsync({ id: item.id });
    } catch (error) {
      revertMarkItemAsRead(item.id);
      toast.error("Could not mark notification as read", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const onMarkAllAsRead = async () => {
    const previous = unreadCount;
    setOptimisticMarkAll(true);
    setOptimisticUnreadCount(0);

    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      setOptimisticMarkAll(false);
      setOptimisticUnreadCount(previous);
      toast.error("Could not mark notifications as read", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative">
          <BellIcon className="h-4 w-4" />
          {badgeCount ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 font-semibold text-white">
              {badgeCount}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationInbox
          items={inboxItems}
          isLoading={notificationInboxQuery.isLoading}
          showMarkAll={hasUnreadInInbox}
          markAllBusy={markAllAsReadMutation.isPending}
          onItemClick={onNotificationClick}
          onMarkAsRead={onMarkItemAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />

        <div className="space-y-3 border-t px-3 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">Browser notifications</p>
              <p className="text-xs text-muted-foreground">{permissionLabel}</p>
            </div>
            <Switch
              checked={checked}
              disabled={toggleDisabled}
              onCheckedChange={onToggle}
              aria-label="Toggle browser notifications"
            />
          </div>

          {webPush.permission === "denied" ? (
            <p className="text-xs text-muted-foreground">
              To enable, allow notifications for this site in your browser.
            </p>
          ) : null}

          <div className="flex items-center justify-end">
            <Button asChild type="button" variant="link" className="px-0">
              <Link href={settingsHref}>Manage in settings</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
