import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ReservationInboxWidgetConfig } from "@/features/chat/components/chat-widget/reservation-inbox-widget";

vi.mock("@/common/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@/trpc/client", () => {
  const useQuery = (_input?: unknown, _opts?: unknown) => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(async () => ({ data: undefined })),
  });

  const useUtils = () => ({
    chatMessage: {
      getUnreadCounts: { invalidate: vi.fn(async () => undefined) },
    },
  });

  const useMutation = () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  });

  return {
    trpc: {
      auth: { me: { useQuery } },
      chatMessage: {
        listThreadSummaries: { useQuery },
        getUnreadCounts: { useQuery },
        sendMessage: { useMutation },
      },
      useUtils,
    },
  };
});

vi.mock("@/features/chat/hooks/use-chat-trpc", () => ({
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
    isLoading: false,
  }),
}));

vi.mock("@/features/reservation/sync", () => ({
  useModReservationSync: () => ({
    syncReservationChatInbox: vi.fn(async () => undefined),
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

vi.mock("@/features/chat/components/chat-thread/chat-thread", () => ({
  ChatThread: () => <div>thread</div>,
}));

vi.mock("@/features/chat/hooks/useSupabaseChatChannel", () => ({
  useSupabaseChatChannel: () => ({
    messages: [],
    isWatching: false,
    isRefreshing: false,
    error: null,
    sendMessage: vi.fn(),
    loadMore: vi.fn(),
    refresh: vi.fn(),
    markRead: vi.fn(),
  }),
}));

import { ReservationInboxWidget } from "@/features/chat/components/chat-widget/reservation-inbox-widget";

const config: ReservationInboxWidgetConfig = {
  kind: "organization",
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

    await waitFor(() => {
      const icon = refreshButton.querySelector("svg");
      expect(
        icon?.className.baseVal ?? icon?.getAttribute("class") ?? "",
      ).not.toContain("animate-spin");
    });
  });
});
