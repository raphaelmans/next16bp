import { describe, expect, it } from "vitest";
import {
  isSystemReservationMessageId,
  makeReservationGroupThreadId,
  makeReservationThreadId,
  makeSupportClaimThreadId,
  makeSupportVerificationThreadId,
  parseInboxThreadRef,
  parseReservationGroupThreadId,
  parseReservationThreadId,
  parseSupportThreadId,
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

  describe("support thread ids", () => {
    const cases = [
      {
        label: "claim id parses as claim kind",
        threadId: makeSupportClaimThreadId("claim-1"),
        expected: {
          threadId: "cr-claim-1",
          supportKind: "claim",
          requestId: "claim-1",
        },
      },
      {
        label: "verification id parses as verification kind",
        threadId: makeSupportVerificationThreadId("verification-1"),
        expected: {
          threadId: "vr-verification-1",
          supportKind: "verification",
          requestId: "verification-1",
        },
      },
    ] as const;

    for (const testCase of cases) {
      it(testCase.label, () => {
        // Arrange
        const { threadId, expected } = testCase;

        // Act
        const parsed = parseSupportThreadId(threadId);

        // Assert
        expect(parsed).toEqual(expected);
      });
    }

    it("invalid support id -> returns null", () => {
      // Arrange
      const threadId = "res-reservation-1";

      // Act
      const parsed = parseSupportThreadId(threadId);

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

    it("support scope with reservation thread id -> returns null", () => {
      // Arrange
      const threadId = "res-r-1";

      // Act
      const parsed = parseInboxThreadRef("support", threadId);

      // Assert
      expect(parsed).toBeNull();
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
