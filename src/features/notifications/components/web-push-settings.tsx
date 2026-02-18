"use client";

import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModWebPush } from "../hooks";

export function WebPushSettingsCard({ id }: { id?: string }) {
  const webPush = useModWebPush();

  const enable = async () => {
    try {
      await webPush.enable();
      toast.success("Browser notifications enabled");
    } catch (error) {
      toast.error("Failed to enable notifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const disable = async () => {
    try {
      await webPush.disable();
      toast.success("Browser notifications disabled");
    } catch (error) {
      toast.error("Failed to disable notifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const sendLocalTest = async () => {
    try {
      await webPush.sendLocalTestNotification();
      toast.success("Test notification sent", {
        description: "Check your browser or OS notification center",
      });
    } catch (error) {
      toast.error("Failed to send test notification", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const statusLabel = !webPush.supported
    ? "Unsupported"
    : !webPush.configured
      ? "Not configured"
      : webPush.enabledOnThisDevice
        ? "enabled"
        : webPush.permission === "granted"
          ? "granted (not registered)"
          : (webPush.permission ?? "unknown");

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Browser Notifications</CardTitle>
        <CardDescription>
          Get real-time notifications for reservation updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Status: <span className="text-foreground">{statusLabel}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={enable}
            disabled={
              webPush.busy ||
              !webPush.supported ||
              !webPush.configured ||
              webPush.enabledOnThisDevice
            }
          >
            Enable
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={disable}
            disabled={
              webPush.busy || !webPush.supported || !webPush.enabledOnThisDevice
            }
          >
            Disable
          </Button>
          {webPush.localTestEnabled ? (
            <Button
              type="button"
              variant="secondary"
              onClick={sendLocalTest}
              disabled={!webPush.canSendLocalTest}
            >
              Send test notification
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          {webPush.diagnosticsMessage}
        </p>

        {webPush.diagnosticsCode === "permission_denied" ? (
          <p className="text-xs text-muted-foreground">
            Reset site notification permissions in your browser settings to try
            again.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
