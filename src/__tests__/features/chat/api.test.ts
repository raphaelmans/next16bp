import { describe, expect, it, vi } from "vitest";
import { ChatApi } from "@/features/chat/api";

const callTrpcQueryMock = vi.fn();
const callTrpcMutationMock = vi.fn();

vi.mock("@/common/trpc-client-call", () => ({
  callTrpcQuery: (...args: unknown[]) => callTrpcQueryMock(...args),
  callTrpcMutation: (...args: unknown[]) => callTrpcMutationMock(...args),
}));

describe("ChatApi", () => {
  it("mutChatInboxArchiveThread success -> uses archiveThread transport path", async () => {
    // Arrange
    const clientApi = {
      chatInbox: {
        archiveThread: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new ChatApi({ clientApi, toAppError });
    const expected = { ok: true };
    callTrpcMutationMock.mockResolvedValue(expected);

    // Act
    const result = await api.mutChatInboxArchiveThread({
      threadKind: "reservation",
      threadId: "res-1",
    });

    // Assert
    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["chatInbox", "archiveThread"],
      expect.any(Function),
      { threadKind: "reservation", threadId: "res-1" },
      toAppError,
    );
  });

  it("queryChatInboxListArchivedThreadIds failure -> surfaces mapped app error", async () => {
    // Arrange
    const clientApi = {
      chatInbox: {
        listArchivedThreadIds: { query: vi.fn() },
      },
    } as never;
    const appError = new Error("mapped");
    const toAppError = vi.fn(() => appError as never);
    const api = new ChatApi({ clientApi, toAppError });
    callTrpcQueryMock.mockRejectedValue(appError);

    // Act + Assert
    await expect(
      api.queryChatInboxListArchivedThreadIds({ threadKind: "support" }),
    ).rejects.toBe(appError);
  });
});
