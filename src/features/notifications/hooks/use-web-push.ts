"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export const BROWSER_PUSH_STATE_KEY = ["webPush", "browserState"] as const;

type BrowserPushState = {
  permission: NotificationPermission | null;
  hasSubscription: boolean;
};

type UpsertRef = React.RefObject<{
  mutateAsync: (input: {
    subscription: {
      endpoint: string;
      expirationTime: string | null;
      keys: { p256dh: string; auth: string };
    };
    userAgent: string;
  }) => Promise<unknown>;
}>;

async function fetchBrowserPushState(
  upsertRef: UpsertRef,
): Promise<BrowserPushState> {
  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  if (!isSupported) {
    return { permission: null, hasSubscription: false };
  }

  const permission = Notification.permission;

  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      return { permission, hasSubscription: false };
    }

    const subscription = await reg.pushManager.getSubscription();
    const hasSubscription = Boolean(subscription);

    // Auto-sync: if the browser has a subscription, ensure the server knows
    // about it. The upsert is idempotent (onConflictDoUpdate on endpoint),
    // so this is safe to call even when already in sync.
    if (subscription && permission === "granted") {
      const json = subscription.toJSON();
      if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
        try {
          await upsertRef.current.mutateAsync({
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
        } catch {
          // Sync is best-effort — don't block UI if it fails.
        }
      }
    }

    return { permission, hasSubscription };
  } catch {
    return { permission, hasSubscription: false };
  }
}

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

  const queryClient = useQueryClient();

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

  // Ref so queryFn can call upsert without being re-created on each render.
  const upsertRef = React.useRef(upsertMutation);
  upsertRef.current = upsertMutation;

  const [actionPending, setActionPending] = React.useState(false);

  const browserStateQuery = useQuery({
    queryKey: BROWSER_PUSH_STATE_KEY,
    queryFn: () => fetchBrowserPushState(upsertRef as UpsertRef),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: supported,
  });

  const permission =
    browserStateQuery.data?.permission ??
    (supported ? Notification.permission : null);
  const hasSubscription = browserStateQuery.data?.hasSubscription ?? false;
  const busy = actionPending || browserStateQuery.isFetching;

  const configured = Boolean(vapidQuery.data?.configured);
  const publicKey = vapidQuery.data?.publicKey ?? null;

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: BROWSER_PUSH_STATE_KEY,
    });
  }, [queryClient]);

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

    setActionPending(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      let nextPermission = Notification.permission;
      if (nextPermission !== "granted") {
        nextPermission = await Notification.requestPermission();
      }

      if (nextPermission !== "granted") {
        queryClient.setQueryData<BrowserPushState>(BROWSER_PUSH_STATE_KEY, {
          permission: nextPermission,
          hasSubscription: false,
        });
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

      // Optimistic update — instant UI feedback
      queryClient.setQueryData<BrowserPushState>(BROWSER_PUSH_STATE_KEY, {
        permission: nextPermission,
        hasSubscription: true,
      });

      try {
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
      } catch (error) {
        // Server upsert failed — re-read browser truth
        await queryClient.invalidateQueries({
          queryKey: BROWSER_PUSH_STATE_KEY,
        });
        throw error;
      }
    } finally {
      setActionPending(false);
    }
  }, [isSecureContext, publicKey, queryClient, supported, upsertMutation]);

  const disable = React.useCallback(async () => {
    if (!supported) return;

    // Optimistic update
    queryClient.setQueryData<BrowserPushState>(
      BROWSER_PUSH_STATE_KEY,
      (prev) => ({
        permission: prev?.permission ?? null,
        hasSubscription: false,
      }),
    );
    setActionPending(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const subscription = reg ? await reg.pushManager.getSubscription() : null;
      const endpoint = subscription?.endpoint ?? null;

      if (subscription) {
        const unsubscribed = await subscription.unsubscribe();
        if (!unsubscribed) {
          throw new Error("Failed to disable browser notifications");
        }
      }

      if (endpoint) {
        try {
          await revokeMutation.mutateAsync({ endpoint });
        } catch {
          // Server may not have this subscription (state desync) — that's OK,
          // the browser subscription is already unsubscribed above.
        }
      }

      // Read final browser permission state
      queryClient.setQueryData<BrowserPushState>(BROWSER_PUSH_STATE_KEY, {
        permission: Notification.permission,
        hasSubscription: false,
      });
    } catch (error) {
      // Re-read browser truth on failure
      await queryClient.invalidateQueries({
        queryKey: BROWSER_PUSH_STATE_KEY,
      });
      throw error;
    } finally {
      setActionPending(false);
    }
  }, [queryClient, revokeMutation, supported]);

  const sendLocalTestNotification = React.useCallback(async () => {
    if (!supported) {
      throw new Error("Browser notifications are not supported on this device");
    }
    if (!isSecureContext) {
      throw new Error("Notifications require HTTPS or localhost");
    }

    setActionPending(true);
    try {
      let nextPermission = Notification.permission;
      if (nextPermission !== "granted") {
        nextPermission = await Notification.requestPermission();
      }

      queryClient.setQueryData<BrowserPushState>(
        BROWSER_PUSH_STATE_KEY,
        (prev) => ({
          permission: nextPermission,
          hasSubscription: prev?.hasSubscription ?? false,
        }),
      );

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

      await queryClient.invalidateQueries({
        queryKey: BROWSER_PUSH_STATE_KEY,
      });
    } finally {
      setActionPending(false);
    }
  }, [isSecureContext, queryClient, supported]);

  const sendServerTestNotification = React.useCallback(async () => {
    setActionPending(true);
    try {
      await sendTestPushMutation.mutateAsync(undefined);
    } finally {
      setActionPending(false);
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
