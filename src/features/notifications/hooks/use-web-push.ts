"use client";

import * as React from "react";
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

export type UseWebPushResult = {
  supported: boolean;
  configured: boolean;
  permission: NotificationPermission | null;
  enabledOnThisDevice: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
};

export function useWebPush(): UseWebPushResult {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const vapidQuery = trpc.pushSubscription.getVapidPublicKey.useQuery(
    undefined,
    {
      staleTime: 60_000,
    },
  );
  const upsertMutation =
    trpc.pushSubscription.upsertMySubscription.useMutation();
  const revokeMutation =
    trpc.pushSubscription.revokeMySubscription.useMutation();

  const [permission, setPermission] =
    React.useState<NotificationPermission | null>(
      supported ? Notification.permission : null,
    );
  const [hasSubscription, setHasSubscription] = React.useState<boolean>(false);
  const [busy, setBusy] = React.useState(false);

  const configured = Boolean(vapidQuery.data?.configured);
  const publicKey = vapidQuery.data?.publicKey ?? null;

  const refresh = React.useCallback(async () => {
    if (!supported) {
      setPermission(null);
      setHasSubscription(false);
      return;
    }

    setPermission(Notification.permission);

    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      setHasSubscription(false);
      return;
    }

    const subscription = await reg.pushManager.getSubscription();
    setHasSubscription(Boolean(subscription));
  }, [supported]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = React.useCallback(async () => {
    if (!supported) {
      throw new Error("Browser notifications are not supported on this device");
    }
    if (!publicKey) {
      throw new Error("Web Push is not configured");
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
        throw new Error(
          nextPermission === "denied"
            ? "Permission was denied in your browser"
            : "Permission was not granted",
        );
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

      setHasSubscription(true);
    } finally {
      setBusy(false);
    }
  }, [publicKey, supported, upsertMutation]);

  const disable = React.useCallback(async () => {
    if (!supported) return;

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

      setHasSubscription(false);
      setPermission(Notification.permission);
    } finally {
      setBusy(false);
    }
  }, [revokeMutation, supported]);

  return {
    supported,
    configured,
    permission,
    enabledOnThisDevice: permission === "granted" && hasSubscription,
    busy,
    refresh,
    enable,
    disable,
  };
}
