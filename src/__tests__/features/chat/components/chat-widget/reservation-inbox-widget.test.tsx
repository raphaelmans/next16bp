import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ReservationInboxWidgetConfig } from "@/features/chat/components/chat-widget/reservation-inbox-widget";

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const deferredChannels =
  createDeferred<Array<{ id: string; state: { unreadCount: number } }>>();

const mockClient = {
  queryChannels: vi.fn(async () => deferredChannels.promise),
  on: vi.fn(() => ({ unsubscribe: vi.fn() })),
};

vi.mock("@/common/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@/features/chat/hooks/useModStreamClient", () => ({
  useModStreamClient: () => ({
    client: mockClient,
    isReady: true,
    error: null,
  }),
}));

vi.mock("@/features/chat/hooks/use-chat-trpc", () => ({
  useModChatInvalidation: () => ({
    fetchReservationThreadMetas: vi.fn(async () => []),
    invalidateReservationThreadMetas: vi.fn(async () => undefined),
    invalidateChatInboxListArchivedThreadIds: vi.fn(async () => undefined),
  }),
  useMutReservationChatSendMessage: () => ({ mutateAsync: vi.fn() }),
  useMutChatInboxArchiveThread: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useMutChatInboxUnarchiveThread: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useMutReservationGroupChatSendMessage: () => ({ mutateAsync: vi.fn() }),
  useQueryChatAuth: () => ({
    data: {
      apiKey: "key",
      token: "token",
      user: { id: "user-1", name: "User" },
    },
    isLoading: false,
    isError: false,
  }),
  useQueryChatInboxListArchivedThreadIds: () => ({
    data: { threadIds: [] },
    refetch: vi.fn(async () => ({ data: { threadIds: [] } })),
  }),
  useQueryReservationChatThreadMetas: () => ({
    data: [],
    isFetching: false,
    isPending: false,
    isSuccess: true,
    isError: false,
  }),
}));

vi.mock("@/features/chat/components/inbox-shell/inbox-floating-sheet", () => ({
  InboxFloatingSheet: ({
    listPane,
    threadPane,
  }: {
    listPane: ReactNode;
    threadPane: ReactNode;
  }) => (
    <div>
      {listPane}
      {threadPane}
    </div>
  ),
}));

vi.mock("@/features/chat/components/chat-thread/stream-chat-thread", () => ({
  StreamChatThread: () => <div>thread</div>,
}));

import { ReservationInboxWidget } from "@/features/chat/components/chat-widget/reservation-inbox-widget";

const config: ReservationInboxWidgetConfig = {
  kind: "owner",
  storageKeys: {
    open: "test-chat-open",
    activeReservationThreadId: "test-chat-active-thread",
  },
  ui: {
    sheetTitle: "Inbox",
    sheetDescription: "Desc",
  },
  labels: {
    listPrimary: () => "Primary",
    listSecondary: () => "Secondary",
    threadTitle: () => "Thread",
  },
};

describe("ReservationInboxWidget", () => {
  it("manual refresh button controls spinner lifecycle", async () => {
    // Arrange
    window.localStorage.setItem(config.storageKeys.open, "1");
    render(<ReservationInboxWidget config={config} />);
    const refreshButton = screen.getByRole("button", { name: "Refresh inbox" });

    // Act
    fireEvent.click(refreshButton);

    // Assert
    await waitFor(() => {
      const icon = refreshButton.querySelector("svg");
      expect(icon?.className.baseVal ?? icon?.getAttribute("class")).toContain(
        "animate-spin",
      );
    });

    deferredChannels.resolve([]);

    await waitFor(() => {
      const icon = refreshButton.querySelector("svg");
      expect(
        icon?.className.baseVal ?? icon?.getAttribute("class") ?? "",
      ).not.toContain("animate-spin");
    });
  });
});
