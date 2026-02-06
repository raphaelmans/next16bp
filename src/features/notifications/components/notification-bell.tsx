"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useWebPush } from "../hooks/use-web-push";

type Portal = "owner" | "player" | "admin";

export function NotificationBell({ portal }: { portal: Portal }) {
  const webPush = useWebPush();

  const showAttentionDot =
    webPush.supported &&
    webPush.configured &&
    (webPush.permission !== "granted" || !webPush.enabledOnThisDevice);

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

  const toggleDisabled =
    webPush.busy ||
    !webPush.supported ||
    !webPush.configured ||
    webPush.permission === "denied";

  const checked = webPush.enabledOnThisDevice;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {showAttentionDot ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-background"
              aria-hidden
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-heading font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Get alerts for reservation updates.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">Browser notifications</p>
              <p className="text-xs text-muted-foreground">
                {webPush.permission === "denied"
                  ? "Blocked in your browser settings"
                  : checked
                    ? "Enabled on this device"
                    : "Off"}
              </p>
            </div>
            <Switch
              checked={checked}
              disabled={toggleDisabled}
              onCheckedChange={onToggle}
              aria-label="Toggle browser notifications"
            />
          </div>

          {!webPush.supported ? (
            <p className="text-xs text-muted-foreground">
              Your browser does not support push notifications.
            </p>
          ) : null}
          {webPush.supported && !webPush.configured ? (
            <p className="text-xs text-muted-foreground">
              Notifications are not configured on the server.
            </p>
          ) : null}
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
