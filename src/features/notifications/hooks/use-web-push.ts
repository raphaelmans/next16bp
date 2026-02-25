"use client";

import * as React from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import {
  deriveWebPushState,
  type WebPushDiagnosticsCode,
} from "@/features/notifications/domain";
import { getNotificationsApi } from "../api.runtime";

const notificationsApi = getNotificationsApi();

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
  isSecureContext: boolean;
  configured: boolean;
  permission: NotificationPermission | null;
  enabledOnThisDevice: boolean;
  diagnosticsCode: WebPushDiagnosticsCode;
  diagnosticsMessage: string;
  canSendLocalTest: boolean;
  canSendServerTest: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  sendLocalTestNotification: () => Promise<void>;
  sendServerTestNotification: () => Promise<void>;
};

export function useModWebPush(): UseWebPushResult {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
  const isSecureContext =
    typeof window !== "undefined" ? window.isSecureContext : false;

  const vapidQuery = useFeatureQuery(
    ["pushSubscription", "getVapidPublicKey"],
    notificationsApi.queryPushSubscriptionGetVapidPublicKey,
    undefined,
    {
      staleTime: 60_000,
    },
  );
  const upsertMutation = useFeatureMutation(
    notificationsApi.mutPushSubscriptionUpsertMySubscription,
  );
  const revokeMutation = useFeatureMutation(
    notificationsApi.mutPushSubscriptionRevokeMySubscription,
  );
  const sendTestPushMutation = useFeatureMutation(
    notificationsApi.mutPushSubscriptionSendTestPush,
  );

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

    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        setHasSubscription(false);
        return;
      }

      const subscription = await reg.pushManager.getSubscription();
      setHasSubscription(Boolean(subscription));
    } catch {
      setHasSubscription(false);
    }
  }, [supported]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = React.useCallback(async () => {
    if (!supported) {
      throw new Error("Browser notifications are not supported on this device");
    }
    if (!isSecureContext) {
      throw new Error("Notifications require HTTPS or localhost");
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
  }, [isSecureContext, publicKey, supported, upsertMutation]);

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

  const sendLocalTestNotification = React.useCallback(async () => {
    if (!supported) {
      throw new Error("Browser notifications are not supported on this device");
    }
    if (!isSecureContext) {
      throw new Error("Notifications require HTTPS or localhost");
    }

    setBusy(true);
    try {
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

      const registration =
        (await navigator.serviceWorker.getRegistration("/")) ??
        (await navigator.serviceWorker.register("/sw.js"));

      await registration.showNotification("KudosCourts test notification", {
        body: "If you can see this, browser notifications are working on this device.",
        icon: "/logo.png",
        tag: "test.web_push.local",
        data: {
          url: "/",
        },
      });

      await refresh();
    } finally {
      setBusy(false);
    }
  }, [isSecureContext, refresh, supported]);

  const sendServerTestNotification = React.useCallback(async () => {
    setBusy(true);
    try {
      await sendTestPushMutation.mutateAsync(undefined);
    } finally {
      setBusy(false);
    }
  }, [sendTestPushMutation]);

  const {
    enabledOnThisDevice,
    diagnosticsCode,
    diagnosticsMessage,
    canSendLocalTest,
    canSendServerTest,
  } = deriveWebPushState({
    supported,
    isSecureContext,
    configured,
    permission,
    hasSubscription,
    busy,
  });

  return {
    supported,
    isSecureContext,
    configured,
    permission,
    enabledOnThisDevice,
    diagnosticsCode,
    diagnosticsMessage,
    canSendLocalTest,
    canSendServerTest,
    busy,
    refresh,
    enable,
    disable,
    sendLocalTestNotification,
    sendServerTestNotification,
  };
}
