import { describe, expect, it } from "vitest";
import {
  isSystemReservationMessageId,
  makeReservationGroupThreadId,
  makeReservationThreadId,
  parseInboxThreadRef,
  parseReservationGroupThreadId,
  parseReservationThreadId,
} from "@/lib/modules/chat/shared/domain";

describe("chat shared domain", () => {
  describe("reservation thread ids", () => {
    it("make + parse reservation id -> returns canonical ref", () => {
      // Arrange
      const reservationId = "reservation-1";

      // Act
      const threadId = makeReservationThreadId(reservationId);
      const parsed = parseReservationThreadId(threadId);

      // Assert
      expect(threadId).toBe("res-reservation-1");
      expect(parsed).toEqual({ threadId, reservationId });
    });

    it("invalid reservation prefix -> returns null", () => {
      // Arrange
      const threadId = "cr-claim-1";

      // Act
      const parsed = parseReservationThreadId(threadId);

      // Assert
      expect(parsed).toBeNull();
    });
  });

  describe("parseInboxThreadRef", () => {
    it("reservation scope with reservation thread id -> parses", () => {
      // Arrange
      const threadId = "res-r-1";

      // Act
      const parsed = parseInboxThreadRef("reservation", threadId);

      // Assert
      expect(parsed).toEqual({
        threadKind: "reservation",
        threadId,
        reservationId: "r-1",
      });
    });

    it("reservation scope with reservation group thread id -> parses", () => {
      // Arrange
      const threadId = makeReservationGroupThreadId("group-1");

      // Act
      const parsed = parseInboxThreadRef("reservation", threadId);

      // Assert
      expect(parsed).toEqual({
        threadKind: "reservation",
        threadId,
        reservationGroupId: "group-1",
      });
    });
  });

  describe("reservation group thread ids", () => {
    it("make + parse reservation group id -> returns canonical ref", () => {
      // Arrange
      const reservationGroupId = "group-1";

      // Act
      const threadId = makeReservationGroupThreadId(reservationGroupId);
      const parsed = parseReservationGroupThreadId(threadId);

      // Assert
      expect(threadId).toBe("grp-group-1");
      expect(parsed).toEqual({ threadId, reservationGroupId });
    });
  });

  describe("system reservation message id", () => {
    it("recognized suffix -> returns true", () => {
      // Arrange
      const messageId = "reservation:r-1:player-created:v1";

      // Act
      const result = isSystemReservationMessageId(messageId);

      // Assert
      expect(result).toBe(true);
    });

    it("non-system id -> returns false", () => {
      // Arrange
      const messageId = "plain-message-id";

      // Act
      const result = isSystemReservationMessageId(messageId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
