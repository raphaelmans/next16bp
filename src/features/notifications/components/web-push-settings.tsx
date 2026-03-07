"use client";

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
import {
  getWebPushStatusBadgeVariant,
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

  const sendServerTest = async () => {
    try {
      await webPush.sendServerTestNotification();
      toast.success("Test notification sent", {
        description: "You should receive it shortly",
      });
    } catch (error) {
      toast.error("Couldn't send test notification", {
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
        <div className="flex items-center justify-between">
          <Badge variant={variant}>{label}</Badge>
          {webPush.enabledOnThisDevice ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={disable}
              disabled={disableDisabled}
            >
              Disable
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={enable}
              disabled={enableDisabled}
            >
              Enable
            </Button>
          )}
        </div>

        {webPush.enabledOnThisDevice && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Send a test to verify it works
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={sendServerTest}
              disabled={!webPush.canSendServerTest}
            >
              Test
            </Button>
          </div>
        )}

        {webPush.diagnosticsCode === "permission_denied" && (
          <p className="text-xs text-muted-foreground">
            To unblock, allow notifications for this site in your browser
            settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
