import { describe, expect, it, vi } from "vitest";
import { UserNotificationRepository } from "@/lib/modules/user-notification/repositories/user-notification.repository";

describe("UserNotificationRepository", () => {
  it("createMany empty input -> returns empty without insert", async () => {
    // Arrange
    const db = {
      insert: vi.fn(),
    };
    const repository = new UserNotificationRepository(db as never);

    // Act
    const result = await repository.createMany([]);

    // Assert
    expect(result).toEqual([]);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("markAllAsRead returns updated count", async () => {
    // Arrange
    const returning = vi.fn(async () => [{ id: "n1" }, { id: "n2" }]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const db = { update };
    const repository = new UserNotificationRepository(db as never);

    // Act
    const result = await repository.markAllAsRead("user-1");

    // Assert
    expect(result).toEqual({ count: 2 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
    expect(returning).toHaveBeenCalledTimes(1);
  });
});
