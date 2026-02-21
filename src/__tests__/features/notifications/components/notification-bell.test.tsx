import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const webPushState = {
  enable: vi.fn(async () => undefined),
  disable: vi.fn(async () => undefined),
  busy: false,
  supported: true,
  isSecureContext: true,
  configured: true,
  permission: "granted" as const,
  enabledOnThisDevice: false,
  diagnosticsMessage: "All good",
};

vi.mock("@/features/notifications/hooks", () => ({
  useModWebPush: () => webPushState,
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
  it("renders boundary copy for chat unread location", () => {
    // Arrange + Act
    render(<NotificationBell portal="owner" />);

    // Assert
    expect(
      screen.getByText(
        "Chat unread counts are shown in the chat inbox/widget.",
      ),
    ).toBeTruthy();
  });

  it("toggle on -> calls web push enable", async () => {
    // Arrange
    render(<NotificationBell portal="player" />);

    // Act
    fireEvent.click(screen.getByLabelText("Toggle browser notifications"));

    // Assert
    expect(webPushState.enable).toHaveBeenCalledTimes(1);
  });
});
