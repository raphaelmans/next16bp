import { describe, expect, it } from "vitest";
import {
  computeReservationGroupTotals,
  deriveReservationGroupStatus,
  findReservationGroupDuplicateItemKeys,
  type ReservationLifecycleStatus,
} from "@/lib/modules/reservation/shared/domain";

describe("reservation/shared/domain", () => {
  describe("findReservationGroupDuplicateItemKeys", () => {
    it("returns duplicate keys for repeated court-time-duration items", () => {
      // Arrange
      const items = [
        {
          courtId: "court-a",
          startTime: "2026-03-01T10:00:00.000Z",
          durationMinutes: 60,
        },
        {
          courtId: "court-a",
          startTime: "2026-03-01T10:00:00.000Z",
          durationMinutes: 60,
        },
        {
          courtId: "court-b",
          startTime: "2026-03-01T11:00:00.000Z",
          durationMinutes: 60,
        },
      ];

      // Act
      const duplicates = findReservationGroupDuplicateItemKeys(items);

      // Assert
      expect(duplicates).toEqual(["court-a|2026-03-01T10:00:00.000Z|60"]);
    });

    it("returns empty array when there are no duplicate keys", () => {
      // Arrange
      const items = [
        {
          courtId: "court-a",
          startTime: "2026-03-01T10:00:00.000Z",
          durationMinutes: 60,
        },
        {
          courtId: "court-a",
          startTime: "2026-03-01T11:00:00.000Z",
          durationMinutes: 60,
        },
      ];

      // Act
      const duplicates = findReservationGroupDuplicateItemKeys(items);

      // Assert
      expect(duplicates).toEqual([]);
    });
  });

  describe("computeReservationGroupTotals", () => {
    it("returns zero totals and null currency for empty items", () => {
      // Arrange
      const items: Array<{ totalPriceCents: number; currency: string }> = [];

      // Act
      const totals = computeReservationGroupTotals(items);

      // Assert
      expect(totals).toEqual({
        totalPriceCents: 0,
        currency: null,
        hasMixedCurrencies: false,
      });
    });

    it("returns summed cents and shared currency when currencies match", () => {
      // Arrange
      const items = [
        { totalPriceCents: 1500, currency: "PHP" },
        { totalPriceCents: 2500, currency: "PHP" },
      ];

      // Act
      const totals = computeReservationGroupTotals(items);

      // Assert
      expect(totals).toEqual({
        totalPriceCents: 4000,
        currency: "PHP",
        hasMixedCurrencies: false,
      });
    });

    it("flags mixed currencies", () => {
      // Arrange
      const items = [
        { totalPriceCents: 1500, currency: "PHP" },
        { totalPriceCents: 2500, currency: "USD" },
      ];

      // Act
      const totals = computeReservationGroupTotals(items);

      // Assert
      expect(totals).toEqual({
        totalPriceCents: 4000,
        currency: "PHP",
        hasMixedCurrencies: true,
      });
    });
  });

  describe("deriveReservationGroupStatus", () => {
    it("returns CREATED for empty status list", () => {
      // Arrange
      const statuses: ReservationLifecycleStatus[] = [];

      // Act
      const status = deriveReservationGroupStatus(statuses);

      // Assert
      expect(status).toBe("CREATED");
    });

    it("returns the most actionable status for mixed states", () => {
      // Arrange
      const statuses = ["CONFIRMED", "AWAITING_PAYMENT", "CANCELLED"] as const;

      // Act
      const status = deriveReservationGroupStatus([...statuses]);

      // Assert
      expect(status).toBe("AWAITING_PAYMENT");
    });

    it("prioritizes PAYMENT_MARKED_BY_USER over all other statuses", () => {
      // Arrange
      const statuses = [
        "CREATED",
        "AWAITING_PAYMENT",
        "CONFIRMED",
        "PAYMENT_MARKED_BY_USER",
      ] as const;

      // Act
      const status = deriveReservationGroupStatus([...statuses]);

      // Assert
      expect(status).toBe("PAYMENT_MARKED_BY_USER");
    });
  });
});
