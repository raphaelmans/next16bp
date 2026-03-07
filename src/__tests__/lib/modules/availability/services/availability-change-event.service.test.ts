import { describe, expect, it, vi } from "vitest";
import { AvailabilityChangeEventService } from "@/lib/modules/availability/services/availability-change-event.service";

describe("AvailabilityChangeEventService", () => {
  it("emits a reservation booked event with patchable slot state", async () => {
    const repository = {
      createMany: vi.fn(async () => []),
    };

    const service = new AvailabilityChangeEventService(repository as never);

    await service.emitReservationBooked(
      {
        id: "res-1",
        courtId: "court-1",
        startTime: new Date("2026-03-07T10:00:00.000Z"),
        endTime: new Date("2026-03-07T11:00:00.000Z"),
        totalPriceCents: 1200,
        currency: "PHP",
      } as never,
      {
        court: {
          id: "court-1",
          sportId: "sport-1",
        } as never,
        place: {
          id: "place-1",
        } as never,
      },
      "reservation.created",
    );

    expect(repository.createMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          sourceKind: "RESERVATION",
          sourceEvent: "reservation.created",
          sourceId: "res-1",
          courtId: "court-1",
          placeId: "place-1",
          sportId: "sport-1",
          slotStatus: "BOOKED",
          unavailableReason: "RESERVATION",
          totalPriceCents: 1200,
          currency: "PHP",
        }),
      ],
      undefined,
    );
  });
});
