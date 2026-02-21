import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/shared/kernel/errors";

const mockService = {
  archiveThread: vi.fn(),
  unarchiveThread: vi.fn(),
  listArchivedThreadIds: vi.fn(),
};

vi.mock("@/lib/modules/chat/factories/chat-inbox.factory", () => ({
  makeChatInboxService: () => mockService,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { chatInboxRouter } from "@/lib/modules/chat/chat-inbox.router";

const createCaller = () =>
  chatInboxRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: { userId: "user-1", email: "a@b.com", role: "member" },
    userId: "user-1",
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as any,
  } as any);

describe("chatInboxRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archiveThread app error not found -> maps to TRPC NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockService.archiveThread.mockRejectedValue(new NotFoundError("missing"));

    // Act + Assert
    await expect(
      caller.archiveThread({ threadKind: "reservation", threadId: "res-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("archiveThread invalid input -> rejects before service call", async () => {
    // Arrange
    const caller = createCaller();

    // Act + Assert
    await expect(
      caller.archiveThread({
        threadKind: "invalid" as "reservation",
        threadId: "res-1",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(mockService.archiveThread).not.toHaveBeenCalled();
  });

  it("listArchivedThreadIds valid request -> returns service payload", async () => {
    // Arrange
    const caller = createCaller();
    mockService.listArchivedThreadIds.mockResolvedValue({
      threadIds: ["cr-1", "vr-2"],
    });

    // Act
    const result = await caller.listArchivedThreadIds({
      threadKind: "support",
    });

    // Assert
    expect(result).toEqual({ threadIds: ["cr-1", "vr-2"] });
    expect(mockService.listArchivedThreadIds).toHaveBeenCalledWith(
      { userId: "user-1", role: "player" },
      { threadKind: "support" },
    );
  });
});
