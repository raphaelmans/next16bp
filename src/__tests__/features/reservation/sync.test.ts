import { describe, expect, it } from "vitest";
import {
  extractReservationIdFromNotificationHref,
  isReservationNotificationEventType,
} from "@/features/reservation/sync";

describe("reservation sync helpers", () => {
  it("recognizes reservation notification event types", () => {
    expect(isReservationNotificationEventType("reservation.confirmed")).toBe(
      true,
    );
    expect(
      isReservationNotificationEventType("reservation_group.created"),
    ).toBe(true);
    expect(isReservationNotificationEventType("claim_request.approved")).toBe(
      false,
    );
  });

  it("extracts canonical reservation ids from supported notification hrefs", () => {
    expect(
      extractReservationIdFromNotificationHref("/reservations/res_123"),
    ).toBe("res_123");
    expect(
      extractReservationIdFromNotificationHref(
        "/organization/reservations/res_456",
      ),
    ).toBe("res_456");
    expect(
      extractReservationIdFromNotificationHref(
        "/organization/reservations/group/grp_789",
      ),
    ).toBeUndefined();
  });
});
