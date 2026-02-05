"use client";

import * as React from "react";
import { toast } from "sonner";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/trpc/client";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isWebPushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

export function WebPushSettingsCard() {
  const vapidQuery = trpc.pushSubscription.getVapidPublicKey.useQuery();
  const upsertMutation =
    trpc.pushSubscription.upsertMySubscription.useMutation();
  const revokeMutation =
    trpc.pushSubscription.revokeMySubscription.useMutation();

  const [permission, setPermission] =
    React.useState<NotificationPermission | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isWebPushSupported()) return;
    setPermission(Notification.permission);
  }, []);

  const enable = async () => {
    if (!isWebPushSupported()) {
      toast.error("Browser notifications are not supported on this device");
      return;
    }

    const publicKey = vapidQuery.data?.publicKey;
    if (!publicKey) {
      toast.error("Web Push is not configured", {
        description: "Missing VAPID public key on the server",
      });
      return;
    }

    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      let nextPermission = Notification.permission;
      if (nextPermission !== "granted") {
        nextPermission = await Notification.requestPermission();
      }
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        toast.error("Notifications not enabled", {
          description:
            nextPermission === "denied"
              ? "Permission was denied in your browser"
              : "Permission was not granted",
        });
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Browser returned an invalid subscription");
      }

      await upsertMutation.mutateAsync({
        subscription: {
          endpoint: json.endpoint,
          expirationTime:
            typeof json.expirationTime === "number"
              ? String(json.expirationTime)
              : json.expirationTime
                ? String(json.expirationTime)
                : null,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        },
        userAgent: navigator.userAgent,
      });

      toast.success("Browser notifications enabled");
    } catch (error) {
      toast.error("Failed to enable notifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!isWebPushSupported()) return;

    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const subscription = reg ? await reg.pushManager.getSubscription() : null;
      const endpoint = subscription?.endpoint ?? null;

      if (subscription) {
        await subscription.unsubscribe();
      }

      if (endpoint) {
        await revokeMutation.mutateAsync({ endpoint });
      }

      toast.success("Browser notifications disabled");
    } catch (error) {
      toast.error("Failed to disable notifications", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    } finally {
      setBusy(false);
    }
  };

  const supported = isWebPushSupported();
  const configured = Boolean(vapidQuery.data?.configured);

  const statusLabel = !supported
    ? "Unsupported"
    : !configured
      ? "Not configured"
      : (permission ?? "unknown");

  return (
    <Card>
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
              busy || !supported || !configured || permission === "granted"
            }
          >
            Enable
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={disable}
            disabled={busy || !supported || permission !== "granted"}
          >
            Disable
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
