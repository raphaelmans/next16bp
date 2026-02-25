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
import {
  getWebPushSettingsStatusLabel,
  isWebPushDisableActionDisabled,
  isWebPushEnableActionDisabled,
} from "../domain";
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

  const statusLabel = getWebPushSettingsStatusLabel({
    supported: webPush.supported,
    configured: webPush.configured,
    enabledOnThisDevice: webPush.enabledOnThisDevice,
    permission: webPush.permission,
  });

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
        <div className="text-sm text-muted-foreground">
          Status: <span className="text-foreground">{statusLabel}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={enable} disabled={enableDisabled}>
            Enable
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={disable}
            disabled={disableDisabled}
          >
            Disable
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={sendLocalTest}
            disabled={!webPush.canSendLocalTest}
          >
            Test local notification
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={sendServerTest}
            disabled={!webPush.canSendServerTest}
          >
            Test server push
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {webPush.diagnosticsMessage}
        </p>
        <p className="text-xs text-muted-foreground">
          Local test checks that your browser can show notifications. Server
          test verifies the full push pipeline from the server to this device.
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
