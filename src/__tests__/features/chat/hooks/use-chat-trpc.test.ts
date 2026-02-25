import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  featureQuerySpy,
  featureMutationSpy,
  invalidateMock,
  fetchMock,
  chatApi,
} = vi.hoisted(() => ({
  featureQuerySpy: vi.fn(),
  featureMutationSpy: vi.fn(),
  invalidateMock: vi.fn(async () => undefined),
  fetchMock: vi.fn(async () => undefined),
  chatApi: {
    queryChatInboxListArchivedThreadIds: vi.fn(),
    mutChatInboxArchiveThread: vi.fn(),
    mutChatInboxUnarchiveThread: vi.fn(),
    queryChatGetAuth: vi.fn(),
    queryChatPocGetAuth: vi.fn(),
    mutChatPocGetOrCreateDm: vi.fn(),
    queryReservationChatGetSession: vi.fn(),
    queryReservationChatGetGroupSession: vi.fn(),
    mutReservationChatSendMessage: vi.fn(),
    mutReservationChatSendGroupMessage: vi.fn(),
    queryReservationChatGetThreadMetas: vi.fn(),
    mutSupportChatBackfillClaimThreads: vi.fn(),
    mutSupportChatSendClaimMessage: vi.fn(),
    mutSupportChatSendVerificationMessage: vi.fn(),
    querySupportChatGetClaimSession: vi.fn(),
    querySupportChatGetVerificationSession: vi.fn(),
  },
}));

vi.mock("@/common/feature-api-hooks", () => ({
  useFeatureQuery: (
    path: unknown,
    queryFn: unknown,
    input?: unknown,
    options?: unknown,
  ) => {
    featureQuerySpy(path, queryFn, input, options);
    return { data: null };
  },
  useFeatureMutation: (mutationFn: unknown, options?: unknown) => {
    featureMutationSpy(mutationFn, options);
    return { mutateAsync: vi.fn() };
  },
}));

vi.mock("@/features/chat/api.runtime", () => ({
  getChatApi: () => chatApi,
}));

vi.mock("@/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      reservationChat: {
        getThreadMetas: {
          invalidate: invalidateMock,
          fetch: fetchMock,
        },
      },
      chatInbox: {
        listArchivedThreadIds: {
          invalidate: invalidateMock,
          fetch: fetchMock,
        },
      },
    }),
  },
}));

import {
  useModChatInvalidation,
  useMutChatInboxArchiveThread,
  useQueryChatInboxListArchivedThreadIds,
} from "@/features/chat/hooks/use-chat-trpc";

describe("use-chat-trpc hooks", () => {
  it("useQueryChatInboxListArchivedThreadIds -> uses feature query adapter", () => {
    // Arrange + Act
    renderHook(() =>
      useQueryChatInboxListArchivedThreadIds(
        { threadKind: "support" },
        { enabled: true },
      ),
    );

    // Assert
    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["chatInbox", "listArchivedThreadIds"],
      chatApi.queryChatInboxListArchivedThreadIds,
      { threadKind: "support" },
      { enabled: true },
    );
  });

  it("useMutChatInboxArchiveThread -> uses feature mutation adapter", () => {
    // Arrange + Act
    renderHook(() => useMutChatInboxArchiveThread({ retry: false }));

    // Assert
    expect(featureMutationSpy).toHaveBeenCalledWith(
      chatApi.mutChatInboxArchiveThread,
      { retry: false },
    );
  });

  it("useModChatInvalidation -> forwards invalidation calls to trpc utils", async () => {
    // Arrange
    const { result } = renderHook(() => useModChatInvalidation());

    // Act
    await result.current.invalidateChatInboxListArchivedThreadIds({
      threadKind: "reservation",
    });
    await result.current.fetchReservationThreadMetas({
      reservationIds: ["r-1"],
    });

    // Assert
    expect(invalidateMock).toHaveBeenCalledWith({ threadKind: "reservation" });
    expect(fetchMock).toHaveBeenCalledWith({ reservationIds: ["r-1"] });
  });
});
