"use client";

import { Monitor, Server } from "lucide-react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getWebPushStatusBadgeVariant,
  isWebPushDisableActionDisabled,
  isWebPushEnableActionDisabled,
} from "../domain";
import { useModWebPush } from "../hooks";

export function WebPushSettingsCard({
  id,
  onEnabled,
}: {
  id?: string;
  onEnabled?: () => void;
}) {
  const webPush = useModWebPush();

  const enable = async () => {
    try {
      await webPush.enable();
      toast.success("Browser notifications enabled");
      onEnabled?.();
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
      toast.success("Local test sent", {
        description: "Check your browser or OS notification center",
      });
    } catch (error) {
      toast.error("Failed to send local test", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const sendServerTest = async () => {
    try {
      await webPush.sendServerTestNotification();
      toast.success("Server test push sent", {
        description: "A push was sent through the server pipeline",
      });
    } catch (error) {
      toast.error("Failed to send server test push", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const { variant, label } = getWebPushStatusBadgeVariant(
    webPush.diagnosticsCode,
  );

  const enableDisabled = isWebPushEnableActionDisabled({
    busy: webPush.busy,
    supported: webPush.supported,
    configured: webPush.configured,
    enabledOnThisDevice: webPush.enabledOnThisDevice,
  });

  const disableDisabled = isWebPushDisableActionDisabled({
    busy: webPush.busy,
    supported: webPush.supported,
    enabledOnThisDevice: webPush.enabledOnThisDevice,
  });

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Browser Notifications</CardTitle>
        <CardDescription>
          Get real-time notifications for reservation updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={variant}>{label}</Badge>
        </div>

        {/* Primary action */}
        <div className="flex gap-2">
          {webPush.enabledOnThisDevice ? (
            <Button
              type="button"
              variant="outline"
              onClick={disable}
              disabled={disableDisabled}
            >
              Disable
            </Button>
          ) : (
            <Button type="button" onClick={enable} disabled={enableDisabled}>
              Enable
            </Button>
          )}
        </div>

        {/* Test notifications */}
        <Separator />
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Test Notifications
          </p>
          <div className="flex items-center gap-3">
            <Monitor className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Local</p>
              <p className="text-xs text-muted-foreground">
                Verifies your browser can show notifications
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendLocalTest}
              disabled={!webPush.canSendLocalTest}
            >
              Send
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Server className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Server</p>
              <p className="text-xs text-muted-foreground">
                Verifies the full push pipeline to this device
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendServerTest}
              disabled={!webPush.canSendServerTest}
            >
              Send
            </Button>
          </div>
        </div>

        {/* Diagnostics footer */}
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
