import { describe, expect, it, vi } from "vitest";
import { UserNotificationService } from "@/lib/modules/user-notification/services/user-notification.service";

const createService = () => {
  const repo = {
    createMany: vi.fn(async (rows) => rows),
    listByUserId: vi.fn(async () => []),
    countUnreadByUserId: vi.fn(async () => 0),
    markAsRead: vi.fn(async () => null as { id: string } | null),
    markAllAsRead: vi.fn(async () => ({ count: 0 })),
  };

  const transactionManager = {
    run: vi.fn(async (fn) => fn({})),
  };

  return {
    repo,
    transactionManager,
    service: new UserNotificationService(
      repo as never,
      transactionManager as never,
    ),
  };
};

describe("UserNotificationService", () => {
  it("createMany runs in transaction when ctx missing", async () => {
    // Arrange
    const { service, repo, transactionManager } = createService();
    const rows = [
      {
        userId: "u1",
        eventType: "reservation.confirmed",
        title: "Reservation confirmed",
        idempotencyKey: "k1",
      },
    ];

    // Act
    await service.createMany(rows as never[]);

    // Assert
    expect(transactionManager.run).toHaveBeenCalledTimes(1);
    expect(repo.createMany).toHaveBeenCalledTimes(1);
  });

  it("markAllAsRead returns repository count", async () => {
    // Arrange
    const { service, repo } = createService();
    repo.markAllAsRead.mockResolvedValue({ count: 7 });

    // Act
    const result = await service.markAllAsRead("u1");

    // Assert
    expect(result).toEqual({ count: 7 });
  });

  it("markAsRead forwards id and user id", async () => {
    // Arrange
    const { service, repo } = createService();
    repo.markAsRead.mockResolvedValue({ id: "n1" });

    // Act
    await service.markAsRead("u1", "n1");

    // Assert
    expect(repo.markAsRead).toHaveBeenCalledWith("n1", "u1", { tx: {} });
  });
});
