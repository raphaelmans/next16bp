import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebPushDiagnosticsCode } from "@/features/notifications/domain";

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const { toastSuccessSpy, toastErrorSpy, webPushState } = vi.hoisted(() => ({
  toastSuccessSpy: vi.fn(),
  toastErrorSpy: vi.fn(),
  webPushState: {
    supported: true,
    isSecureContext: true,
    configured: true,
    permission: "default" as NotificationPermission,
    enabledOnThisDevice: false,
    diagnosticsCode: "ready" as WebPushDiagnosticsCode,
    diagnosticsMessage: "Ready",
    canSendLocalTest: false,
    canSendServerTest: false,
    busy: false,
    refresh: vi.fn(async () => undefined),
    enable: vi.fn(async () => undefined),
    disable: vi.fn(async () => undefined),
    sendLocalTestNotification: vi.fn(async () => undefined),
    sendServerTestNotification: vi.fn(async () => undefined),
  },
}));

vi.mock("@/features/notifications/hooks", () => ({
  useModWebPush: () => webPushState,
}));

vi.mock("@/common/toast", () => ({
  toast: {
    success: toastSuccessSpy,
    error: toastErrorSpy,
  },
}));

vi.mock("@/common/toast/errors", () => ({
  getClientErrorMessage: () => "Please try again",
}));

import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";

describe("WebPushSettingsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webPushState.supported = true;
    webPushState.isSecureContext = true;
    webPushState.configured = true;
    webPushState.permission = "default";
    webPushState.enabledOnThisDevice = false;
    webPushState.diagnosticsCode = "ready";
    webPushState.diagnosticsMessage = "Ready";
    webPushState.canSendLocalTest = false;
    webPushState.canSendServerTest = false;
    webPushState.busy = false;
  });

  it("enable success toast fires only after enable settles", async () => {
    // Arrange
    const deferred = createDeferred<void>();
    webPushState.enable.mockImplementation(async () => deferred.promise);
    render(<WebPushSettingsCard />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Enable" }));

    // Assert
    expect(webPushState.enable).toHaveBeenCalledTimes(1);
    expect(toastSuccessSpy).not.toHaveBeenCalled();

    deferred.resolve();

    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        "Browser notifications enabled",
      );
    });
  });

  it("disable success toast fires only after disable settles", async () => {
    // Arrange
    const deferred = createDeferred<void>();
    webPushState.enabledOnThisDevice = true;
    webPushState.permission = "granted";
    webPushState.disable.mockImplementation(async () => deferred.promise);
    render(<WebPushSettingsCard />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    // Assert
    expect(webPushState.disable).toHaveBeenCalledTimes(1);
    expect(toastSuccessSpy).not.toHaveBeenCalled();

    deferred.resolve();

    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        "Browser notifications disabled",
      );
    });
  });

  it("enable failure shows error toast after rejection", async () => {
    // Arrange
    const deferred = createDeferred<void>();
    webPushState.enable.mockImplementation(async () => deferred.promise);
    render(<WebPushSettingsCard />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Enable" }));

    // Assert
    expect(toastErrorSpy).not.toHaveBeenCalled();

    deferred.reject(new Error("Failed"));

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Failed to enable notifications",
        {
          description: "Please try again",
        },
      );
    });
  });
});
