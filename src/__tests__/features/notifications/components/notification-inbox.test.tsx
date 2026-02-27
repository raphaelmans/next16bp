import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  NotificationInbox,
  type NotificationInboxItem,
} from "@/features/notifications/components/notification-inbox";

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("NotificationInbox", () => {
  it("empty state renders when no items", () => {
    // Arrange + Act
    render(
      <NotificationInbox
        items={[]}
        isLoading={false}
        showMarkAll={false}
        markAllBusy={false}
        onItemClick={vi.fn()}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText("No notifications yet")).toBeTruthy();
  });

  it("clicking an item triggers callback", () => {
    // Arrange
    const onItemClick = vi.fn();
    const item: NotificationInboxItem = {
      id: "n1",
      title: "Reservation confirmed",
      body: "Court A",
      href: "/reservations/r1",
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    // Act
    render(
      <NotificationInbox
        items={[item]}
        isLoading={false}
        showMarkAll={false}
        markAllBusy={false}
        onItemClick={onItemClick}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Reservation confirmed"));

    // Assert
    expect(onItemClick).toHaveBeenCalledWith(item);
  });

  it("mark-all button calls callback", () => {
    // Arrange
    const onMarkAllAsRead = vi.fn();

    // Act
    render(
      <NotificationInbox
        items={[]}
        isLoading={false}
        showMarkAll
        markAllBusy={false}
        onItemClick={vi.fn()}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={onMarkAllAsRead}
      />,
    );
    fireEvent.click(screen.getByText("Mark all as read"));

    // Assert
    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
  });
});
