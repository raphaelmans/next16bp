import { describe, expect, it } from "vitest";
import { buildNotificationContent } from "@/lib/modules/notification-delivery/shared/domain";

describe("notification content reservation links", () => {
  it("uses the payment route for awaiting payment events", () => {
    const content = buildNotificationContent(
      "reservation.awaiting_payment",
      {
        reservationId: "res-1",
        placeName: "Place A",
        courtLabel: "Court 1",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T09:00:00.000Z",
        totalPriceCents: 1200,
        currency: "PHP",
      },
      "",
    );

    if ("error" in content) {
      throw new Error(content.error);
    }

    expect(content.push.url).toBe("/reservations/res-1?step=payment");
  });

  it("uses the detail route for confirmed events", () => {
    const content = buildNotificationContent(
      "reservation.confirmed",
      {
        reservationId: "res-1",
        placeName: "Place A",
        courtLabel: "Court 1",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T09:00:00.000Z",
      },
      "",
    );

    if ("error" in content) {
      throw new Error(content.error);
    }

    expect(content.push.url).toBe("/reservations/res-1");
  });

  it("uses status-aware routes for reservation group events", () => {
    const awaitingContent = buildNotificationContent(
      "reservation_group.awaiting_payment",
      {
        reservationGroupId: "grp-1",
        representativeReservationId: "res-1",
        placeName: "Place A",
        courtLabel: "2 courts",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        totalPriceCents: 3000,
        currency: "PHP",
        itemCount: 2,
        items: [
          {
            reservationId: "res-1",
            courtId: "court-1",
            courtLabel: "Court 1",
            startTimeIso: "2026-03-01T08:00:00.000Z",
            endTimeIso: "2026-03-01T09:00:00.000Z",
            totalPriceCents: 1200,
            currency: "PHP",
          },
          {
            reservationId: "res-2",
            courtId: "court-2",
            courtLabel: "Court 2",
            startTimeIso: "2026-03-01T10:00:00.000Z",
            endTimeIso: "2026-03-01T11:00:00.000Z",
            totalPriceCents: 1800,
            currency: "PHP",
          },
        ],
      },
      "",
    );

    if ("error" in awaitingContent) {
      throw new Error(awaitingContent.error);
    }

    const confirmedContent = buildNotificationContent(
      "reservation_group.confirmed",
      {
        reservationGroupId: "grp-1",
        representativeReservationId: "res-1",
        placeName: "Place A",
        courtLabel: "2 courts",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        itemCount: 2,
        items: [
          {
            reservationId: "res-1",
            courtId: "court-1",
            courtLabel: "Court 1",
            startTimeIso: "2026-03-01T08:00:00.000Z",
            endTimeIso: "2026-03-01T09:00:00.000Z",
            totalPriceCents: 1200,
            currency: "PHP",
          },
          {
            reservationId: "res-2",
            courtId: "court-2",
            courtLabel: "Court 2",
            startTimeIso: "2026-03-01T10:00:00.000Z",
            endTimeIso: "2026-03-01T11:00:00.000Z",
            totalPriceCents: 1800,
            currency: "PHP",
          },
        ],
      },
      "",
    );

    if ("error" in confirmedContent) {
      throw new Error(confirmedContent.error);
    }

    expect(awaitingContent.push.url).toBe("/reservations/res-1?step=payment");
    expect(confirmedContent.push.url).toBe("/reservations/res-1");
  });

  it("routes grouped owner lifecycle events to owner reservation detail", () => {
    const groupItems = [
      {
        reservationId: "res-1",
        courtId: "court-1",
        courtLabel: "Court 1",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T09:00:00.000Z",
        totalPriceCents: 1200,
        currency: "PHP",
      },
      {
        reservationId: "res-2",
        courtId: "court-2",
        courtLabel: "Court 2",
        startTimeIso: "2026-03-01T10:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        totalPriceCents: 1800,
        currency: "PHP",
      },
    ];

    const created = buildNotificationContent(
      "reservation_group.created",
      {
        reservationGroupId: "grp-1",
        representativeReservationId: "res-1",
        organizationId: "org-1",
        placeId: "place-1",
        placeName: "Place A",
        totalPriceCents: 3000,
        currency: "PHP",
        playerName: "Player One",
        playerEmail: "player@example.com",
        playerPhone: "09170000000",
        itemCount: 2,
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        items: groupItems,
      },
      "",
    );
    const paymentMarked = buildNotificationContent(
      "reservation_group.payment_marked",
      {
        reservationGroupId: "grp-1",
        representativeReservationId: "res-1",
        organizationId: "org-1",
        placeName: "Place A",
        courtLabel: "2 courts",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        playerName: "Player One",
        itemCount: 2,
        items: groupItems,
      },
      "",
    );
    const cancelled = buildNotificationContent(
      "reservation_group.cancelled",
      {
        reservationGroupId: "grp-1",
        representativeReservationId: "res-1",
        organizationId: "org-1",
        placeName: "Place A",
        courtLabel: "2 courts",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        playerName: "Player One",
        itemCount: 2,
        items: groupItems,
        reason: "Player cancelled",
      },
      "",
    );

    if ("error" in created) {
      throw new Error(created.error);
    }
    if ("error" in paymentMarked) {
      throw new Error(paymentMarked.error);
    }
    if ("error" in cancelled) {
      throw new Error(cancelled.error);
    }

    expect(created.push.url).toBe("/organization/reservations/res-1");
    expect(paymentMarked.push.url).toBe("/organization/reservations/res-1");
    expect(cancelled.push.url).toBe("/organization/reservations/res-1");
  });
});
