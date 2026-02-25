import { beforeEach, describe, expect, it, vi } from "vitest";

const mockService = {
  listMy: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
};

vi.mock(
  "@/lib/modules/user-notification/factories/user-notification.factory",
  () => ({
    makeUserNotificationService: () => mockService,
  }),
);

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { userNotificationRouter } from "@/lib/modules/user-notification/user-notification.router";

const createCaller = () =>
  userNotificationRouter.createCaller({
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
    } as unknown,
  } as unknown as Parameters<typeof userNotificationRouter.createCaller>[0]);

describe("userNotificationRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listMy returns paginated payload", async () => {
    // Arrange
    const caller = createCaller();
    mockService.listMy.mockResolvedValue([
      {
        id: "n1",
        userId: "user-1",
        eventType: "reservation.confirmed",
        title: "Reservation confirmed",
        body: "Body",
        href: "/reservations/r1",
        payload: {},
        readAt: null,
        idempotencyKey: "k1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Act
    const result = await caller.listMy({ limit: 20, offset: 0 });

    // Assert
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(mockService.listMy).toHaveBeenCalledWith(
      "user-1",
      { limit: 21, offset: 0 },
      undefined,
    );
  });

  it("unreadCount returns service count", async () => {
    // Arrange
    const caller = createCaller();
    mockService.getUnreadCount.mockResolvedValue(3);

    // Act
    const result = await caller.unreadCount();

    // Assert
    expect(result).toEqual({ count: 3 });
    expect(mockService.getUnreadCount).toHaveBeenCalledWith("user-1");
  });

  it("markAsRead missing notification -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockService.markAsRead.mockResolvedValue(null);

    // Act + Assert
    await expect(
      caller.markAsRead({ id: "11111111-1111-4111-8111-111111111111" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("markAllAsRead returns count", async () => {
    // Arrange
    const caller = createCaller();
    mockService.markAllAsRead.mockResolvedValue({ count: 5 });

    // Act
    const result = await caller.markAllAsRead();

    // Assert
    expect(result).toEqual({ count: 5 });
    expect(mockService.markAllAsRead).toHaveBeenCalledWith("user-1");
  });
});
