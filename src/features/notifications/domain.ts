export type WebPushDiagnosticsCode =
  | "unsupported"
  | "insecure_context"
  | "permission_denied"
  | "not_configured"
  | "granted_not_registered"
  | "enabled"
  | "ready";

export type WebPushDerivedStateInput = {
  supported: boolean;
  isSecureContext: boolean;
  configured: boolean;
  permission: NotificationPermission | null;
  hasSubscription: boolean;
  busy: boolean;
};

export type WebPushDerivedState = {
  enabledOnThisDevice: boolean;
  diagnosticsCode: WebPushDiagnosticsCode;
  diagnosticsMessage: string;
  canSendLocalTest: boolean;
  canSendServerTest: boolean;
};

export function deriveWebPushState(
  input: WebPushDerivedStateInput,
): WebPushDerivedState {
  const {
    supported,
    isSecureContext,
    configured,
    permission,
    hasSubscription,
    busy,
  } = input;

  const enabledOnThisDevice = permission === "granted" && hasSubscription;

  const diagnosticsCode: WebPushDiagnosticsCode = !supported
    ? "unsupported"
    : !isSecureContext
      ? "insecure_context"
      : permission === "denied"
        ? "permission_denied"
        : enabledOnThisDevice
          ? "enabled"
          : !configured
            ? "not_configured"
            : permission === "granted"
              ? "granted_not_registered"
              : "ready";

  const diagnosticsMessage =
    diagnosticsCode === "unsupported"
      ? "Your browser does not support push notifications."
      : diagnosticsCode === "insecure_context"
        ? "Use HTTPS (or localhost in dev) to enable notifications."
        : diagnosticsCode === "permission_denied"
          ? "Notifications are blocked for this site in browser settings."
          : diagnosticsCode === "enabled"
            ? "Notifications are enabled on this device."
            : diagnosticsCode === "not_configured"
              ? "Server Web Push is not configured yet."
              : diagnosticsCode === "granted_not_registered"
                ? "Permission is granted but this device is not subscribed yet."
                : "Ready to request permission and enable notifications.";

  const canSendLocalTest =
    supported && isSecureContext && permission !== "denied" && !busy;

  const canSendServerTest = enabledOnThisDevice && !busy;

  return {
    enabledOnThisDevice,
    diagnosticsCode,
    diagnosticsMessage,
    canSendLocalTest,
    canSendServerTest,
  };
}

export function getNotificationBellToggleDisabled(input: {
  busy: boolean;
  supported: boolean;
  isSecureContext: boolean;
  configured: boolean;
  permission: NotificationPermission | null;
}): boolean {
  const { busy, supported, isSecureContext, configured, permission } = input;

  return (
    busy ||
    !supported ||
    !isSecureContext ||
    !configured ||
    permission === "denied"
  );
}

export function getNotificationBellPermissionLabel(input: {
  permission: NotificationPermission | null;
  enabledOnThisDevice: boolean;
}): string {
  const { permission, enabledOnThisDevice } = input;

  if (permission === "denied") {
    return "Blocked in your browser settings";
  }

  if (enabledOnThisDevice) {
    return "Enabled on this device";
  }

  return "Off";
}

export type NotificationBellIconVariant = "bell" | "bell-ring" | "bell-off";

export function getNotificationBellIconVariant(input: {
  enabledOnThisDevice: boolean;
}): NotificationBellIconVariant {
  return input.enabledOnThisDevice ? "bell-ring" : "bell-off";
}

export function getNotificationBellBadgeCount(
  unreadCount: number | null | undefined,
): string | null {
  if (!unreadCount || unreadCount <= 0) return null;
  if (unreadCount > 99) return "99+";
  return String(unreadCount);
}

export function getWebPushSettingsStatusLabel(input: {
  supported: boolean;
  configured: boolean;
  enabledOnThisDevice: boolean;
  permission: NotificationPermission | null;
}): string {
  const { supported, configured, enabledOnThisDevice, permission } = input;

  if (!supported) {
    return "Unsupported";
  }

  if (!configured) {
    return "Not configured";
  }

  if (enabledOnThisDevice) {
    return "enabled";
  }

  if (permission === "granted") {
    return "granted (not registered)";
  }

  return permission ?? "unknown";
}

export function isWebPushEnableActionDisabled(input: {
  busy: boolean;
  supported: boolean;
  configured: boolean;
  enabledOnThisDevice: boolean;
}): boolean {
  const { busy, supported, configured, enabledOnThisDevice } = input;

  return busy || !supported || !configured || enabledOnThisDevice;
}

export function isWebPushDisableActionDisabled(input: {
  busy: boolean;
  supported: boolean;
  enabledOnThisDevice: boolean;
}): boolean {
  const { busy, supported, enabledOnThisDevice } = input;

  return busy || !supported || !enabledOnThisDevice;
}

export type WebPushBadgeVariant =
  | "success"
  | "warning"
  | "destructive"
  | "secondary";

export function getWebPushStatusBadgeVariant(
  diagnosticsCode: WebPushDiagnosticsCode,
): { variant: WebPushBadgeVariant; label: string } {
  switch (diagnosticsCode) {
    case "enabled":
      return { variant: "success", label: "Enabled" };
    case "not_configured":
      return { variant: "warning", label: "Not Configured" };
    case "granted_not_registered":
      return { variant: "warning", label: "Not Registered" };
    case "permission_denied":
      return { variant: "destructive", label: "Blocked" };
    case "unsupported":
      return { variant: "secondary", label: "Unsupported" };
    case "insecure_context":
      return { variant: "secondary", label: "Insecure" };
    case "ready":
      return { variant: "secondary", label: "Ready" };
  }
}
