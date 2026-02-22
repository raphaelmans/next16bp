import { describe, expect, it } from "vitest";
import {
  formatSupportThreadTitle,
  getChatStatusBadgeClassName,
  getPlayerReservationStatusLabel,
  getReservationReadOnlyReason,
  getSupportThreadKind,
  getSupportThreadRequestId,
  isReservationMetaArchived,
  isReservationStatusChatEnabled,
  parseTimestampMs,
  type ReservationThreadMetaDomainInput,
  sortReservationInboxIds,
  sumReservationUnreadCounts,
} from "@/features/chat/domain";

describe("chat domain", () => {
  describe("parseTimestampMs", () => {
    const cases = [
      {
        label: "date input -> returns timestamp",
        value: new Date("2026-02-21T10:00:00.000Z"),
        expected: 1771668000000,
      },
      {
        label: "iso string input -> returns timestamp",
        value: "2026-02-21T10:00:00.000Z",
        expected: 1771668000000,
      },
      {
        label: "invalid input -> returns zero",
        value: "invalid-date",
        expected: 0,
      },
    ] as const;

    for (const testCase of cases) {
      it(testCase.label, () => {
        // Arrange
        const { value, expected } = testCase;

        // Act
        const result = parseTimestampMs(value);

        // Assert
        expect(result).toBe(expected);
      });
    }
  });

  describe("reservation archive/read-only derivation", () => {
    const now = new Date("2026-02-21T10:00:00.000Z");

    const meta = (
      status: string,
      endTimeIso = "2026-02-22T10:00:00.000Z",
    ): ReservationThreadMetaDomainInput => ({
      status,
      startTimeIso: "2026-02-21T09:00:00.000Z",
      endTimeIso,
      updatedAtIso: "2026-02-21T08:00:00.000Z",
    });

    it("cancelled reservation -> archived with cancelled reason", () => {
      // Arrange
      const input = meta("CANCELLED");

      // Act
      const archived = isReservationMetaArchived(input, now);
      const reason = getReservationReadOnlyReason(input, now);

      // Assert
      expect(archived).toBe(true);
      expect(reason).toBe(
        "Reservation cancelled. This conversation is archived and read-only.",
      );
    });

    it("past confirmed reservation -> archived with completion reason", () => {
      // Arrange
      const input = meta("CONFIRMED", "2026-02-20T10:00:00.000Z");

      // Act
      const archived = isReservationMetaArchived(input, now);
      const reason = getReservationReadOnlyReason(input, now);

      // Assert
      expect(archived).toBe(true);
      expect(reason).toBe(
        "Reservation complete. This conversation is archived and read-only.",
      );
    });

    it("active created reservation -> not archived and no reason", () => {
      // Arrange
      const input = meta("CREATED");

      // Act
      const archived = isReservationMetaArchived(input, now);
      const reason = getReservationReadOnlyReason(input, now);

      // Assert
      expect(archived).toBe(false);
      expect(reason).toBeNull();
    });
  });

  describe("sortReservationInboxIds", () => {
    it("sorts by activity then unread then start time then id", () => {
      // Arrange
      const reservationIds = ["r-1", "r-2", "r-3"];
      const metasByReservationId = new Map<
        string,
        ReservationThreadMetaDomainInput
      >([
        [
          "r-1",
          {
            status: "CREATED",
            startTimeIso: "2026-02-21T10:00:00.000Z",
            endTimeIso: "2026-02-21T11:00:00.000Z",
            updatedAtIso: "2026-02-21T10:00:00.000Z",
          },
        ],
        [
          "r-2",
          {
            status: "CREATED",
            startTimeIso: "2026-02-21T11:00:00.000Z",
            endTimeIso: "2026-02-21T12:00:00.000Z",
            updatedAtIso: "2026-02-21T10:00:00.000Z",
          },
        ],
        [
          "r-3",
          {
            status: "CREATED",
            startTimeIso: "2026-02-21T09:00:00.000Z",
            endTimeIso: "2026-02-21T10:00:00.000Z",
            updatedAtIso: "2026-02-21T12:00:00.000Z",
          },
        ],
      ]);
      const unreadByReservationId = new Map<string, number>([
        ["r-1", 0],
        ["r-2", 3],
        ["r-3", 1],
      ]);
      const channelActivityMsByReservationId = new Map<string, number>([
        ["r-1", 100],
        ["r-2", 100],
        ["r-3", 500],
      ]);

      // Act
      const sorted = sortReservationInboxIds({
        reservationIds,
        metasByReservationId,
        unreadByReservationId,
        channelActivityMsByReservationId,
      });

      // Assert
      expect(sorted).toEqual(["r-3", "r-2", "r-1"]);
    });
  });

  describe("sumReservationUnreadCounts", () => {
    it("sums unread for selected reservation ids only", () => {
      // Arrange
      const reservationIds = ["r-2", "r-3"];
      const unreadByReservationId = new Map<string, number>([
        ["r-1", 2],
        ["r-2", 4],
        ["r-3", 1],
      ]);

      // Act
      const unread = sumReservationUnreadCounts({
        reservationIds,
        unreadByReservationId,
      });

      // Assert
      expect(unread).toBe(5);
    });

    it("treats missing and negative values as zero", () => {
      // Arrange
      const reservationIds = ["r-1", "r-2", "r-3"];
      const unreadByReservationId = new Map<string, number>([
        ["r-1", -2],
        ["r-2", 3],
      ]);

      // Act
      const unread = sumReservationUnreadCounts({
        reservationIds,
        unreadByReservationId,
      });

      // Assert
      expect(unread).toBe(3);
    });
  });

  describe("support thread helpers", () => {
    it("claim thread id -> claim kind and request id", () => {
      // Arrange
      const channelId = "cr-claim-123";

      // Act
      const kind = getSupportThreadKind(channelId);
      const requestId = getSupportThreadRequestId(channelId);
      const title = formatSupportThreadTitle(channelId);

      // Assert
      expect(kind).toBe("claim");
      expect(requestId).toBe("claim-123");
      expect(title).toBe("Claim • CR-CLAIM-12");
    });

    it("invalid support thread id -> null values with fallback title", () => {
      // Arrange
      const channelId = "support-123";

      // Act
      const kind = getSupportThreadKind(channelId);
      const requestId = getSupportThreadRequestId(channelId);
      const title = formatSupportThreadTitle(channelId);

      // Assert
      expect(kind).toBeNull();
      expect(requestId).toBeNull();
      expect(title).toBe("Support thread");
    });
  });

  describe("reservation status helpers", () => {
    it("chat-enabled statuses -> true for created and false for cancelled", () => {
      // Arrange + Act
      const createdEnabled = isReservationStatusChatEnabled("CREATED");
      const cancelledEnabled = isReservationStatusChatEnabled("CANCELLED");

      // Assert
      expect(createdEnabled).toBe(true);
      expect(cancelledEnabled).toBe(false);
    });

    it("player status label -> returns mapped copy", () => {
      // Arrange + Act
      const awaitingPayment =
        getPlayerReservationStatusLabel("AWAITING_PAYMENT");

      // Assert
      expect(awaitingPayment).toBe("Owner accepted - awaiting payment");
    });
  });

  describe("status badge class", () => {
    it("confirmed status -> returns success class", () => {
      // Arrange + Act
      const className = getChatStatusBadgeClassName("CONFIRMED");

      // Assert
      expect(className).toContain("text-success");
    });
  });
});
