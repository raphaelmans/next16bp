import { describe, expect, it } from "vitest";
import { toReservationThreadTargetsFromThreadIds } from "@/lib/modules/chat/shared/transform";

describe("chat shared transform", () => {
  describe("toReservationThreadTargetsFromThreadIds", () => {
    it("mixed reservation and group thread ids -> returns deduplicated targets", () => {
      // Arrange
      const threadIds = [
        "res-res-1",
        "grp-group-1",
        "res-res-1",
        "grp-group-2",
        "invalid-id",
        null,
      ];

      // Act
      const result = toReservationThreadTargetsFromThreadIds(threadIds);

      // Assert
      expect(result).toEqual({
        reservationIds: ["res-1"],
        reservationGroupIds: ["group-1", "group-2"],
      });
    });
  });
});
