import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const {
  toastSuccessSpy,
  toastErrorSpy,
  webPushState,
  unreadCountState,
  inboxState,
  markAsReadMutation,
  markAllAsReadMutation,
} = vi.hoisted(() => ({
  toastSuccessSpy: vi.fn(),
  toastErrorSpy: vi.fn(),
  webPushState: {
    enable: vi.fn(async () => undefined),
    disable: vi.fn(async () => undefined),
    busy: false,
    supported: true,
    isSecureContext: true,
    configured: true,
    permission: "granted" as const,
    enabledOnThisDevice: false,
    diagnosticsMessage: "All good",
  },
  unreadCountState: { count: 0 },
  inboxState: {
    isLoading: false,
    items: [] as Array<{
      id: string;
      title: string;
      body: string | null;
      href: string | null;
      readAt: string | null;
      createdAt: string;
    }>,
  },
  markAsReadMutation: {
    mutateAsync: vi.fn(async () => undefined),
    isPending: false,
  },
  markAllAsReadMutation: {
    mutateAsync: vi.fn(async () => ({ count: 0 })),
    isPending: false,
  },
}));

vi.mock("@/features/notifications/hooks", () => ({
  useModWebPush: () => webPushState,
  useQueryNotificationUnreadCount: () => ({
    data: { count: unreadCountState.count },
  }),
  useQueryNotificationInbox: () => ({
    data: { items: inboxState.items },
    isLoading: inboxState.isLoading,
  }),
  useMutNotificationMarkAsRead: () => markAsReadMutation,
  useMutNotificationMarkAllAsRead: () => markAllAsReadMutation,
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

vi.mock("@/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      userNotification: {
        listMy: { invalidate: vi.fn(async () => undefined) },
      },
    }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label": string;
  }) => (
    <button
      aria-label={ariaLabel}
      data-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      toggle
    </button>
  ),
}));

import { NotificationBell } from "@/features/notifications/components/notification-bell";

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unreadCountState.count = 0;
    inboxState.isLoading = false;
    inboxState.items = [];
    (webPushState as { permission: NotificationPermission }).permission =
      "granted";
  });

  it("does not render verbose explanatory copy", () => {
    // Arrange + Act
    render(<NotificationBell portal="owner" />);

    // Assert
    expect(
      screen.queryByText("Manage browser alerts for reservation updates."),
    ).toBeNull();
    expect(
      screen.queryByText(
        "Chat unread counts are shown in the chat inbox/widget.",
      ),
    ).toBeNull();
  });

  it("shows unread badge count on bell", () => {
    // Arrange
    unreadCountState.count = 3;

    // Act
    render(<NotificationBell portal="owner" />);

    // Assert
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("shows browser-settings hint when permission is denied", () => {
    // Arrange
    const original = webPushState.permission;
    (webPushState as { permission: NotificationPermission }).permission =
      "denied";

    // Act
    render(<NotificationBell portal="owner" />);

    // Assert
    expect(
      screen.getByText(
        "To enable, allow notifications for this site in your browser.",
      ),
    ).toBeTruthy();

    // Cleanup
    (webPushState as { permission: NotificationPermission }).permission =
      original;
  });

  it("toggle on -> calls web push enable", async () => {
    // Arrange
    const deferred = createDeferred<void>();
    webPushState.enable.mockImplementation(async () => deferred.promise);
    render(<NotificationBell portal="player" />);

    // Act
    fireEvent.click(screen.getByLabelText("Toggle browser notifications"));

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

  it("toggle on failure -> shows error toast after rejection", async () => {
    // Arrange
    const deferred = createDeferred<void>();
    webPushState.enable.mockImplementation(async () => deferred.promise);
    render(<NotificationBell portal="player" />);

    // Act
    fireEvent.click(screen.getByLabelText("Toggle browser notifications"));

    // Assert
    expect(toastErrorSpy).not.toHaveBeenCalled();

    deferred.reject(new Error("Failed"));

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Could not update notifications",
        {
          description: "Please try again",
        },
      );
    });
  });
});
