import { describe, expect, it, vi } from "vitest";
import {
  InvalidReservationAddonSelectionError,
  ReservationNotFoundError,
} from "@/lib/modules/reservation/errors/reservation.errors";

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_ADDON_PRICING_V2: true,
  },
}));

vi.mock("@/lib/modules/chat/ops/post-coach-reservation-message", () => ({
  postCoachReservationMessage: vi.fn(async () => undefined),
}));

import { CoachReservationService } from "@/lib/modules/reservation/services/reservation-coach.service";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type {
  CoachAddonRateRuleRecord,
  CoachAddonRecord,
  CoachHoursWindowRecord,
  CoachRateRuleRecord,
  CoachRecord,
  PaymentProofRecord,
  ProfileRecord,
  ReservationEventRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";

type CoachReservationServiceDeps = ConstructorParameters<
  typeof CoachReservationService
>;

const USER_ID = "coach-user-1";
const COACH_ID = "coach-1";
const PROFILE_ID = "profile-1";
const RESERVATION_ID = "reservation-1";

const toCoachAddonRateRuleRecord = (
  value: Partial<CoachAddonRateRuleRecord>,
): CoachAddonRateRuleRecord => value as CoachAddonRateRuleRecord;
const toCoachAddonRecord = (
  value: Partial<CoachAddonRecord>,
): CoachAddonRecord => value as CoachAddonRecord;
const toCoachHoursWindowRecord = (
  value: Partial<CoachHoursWindowRecord>,
): CoachHoursWindowRecord => value as CoachHoursWindowRecord;
const toCoachRateRuleRecord = (
  value: Partial<CoachRateRuleRecord>,
): CoachRateRuleRecord => value as CoachRateRuleRecord;
const toCoachRecord = (value: Partial<CoachRecord>): CoachRecord =>
  value as CoachRecord;
const toPaymentProofRecord = (
  value: Partial<PaymentProofRecord>,
): PaymentProofRecord => value as PaymentProofRecord;
const toProfileRecord = (value: Partial<ProfileRecord>): ProfileRecord =>
  value as ProfileRecord;
const toReservationEventRecord = (
  value: Partial<ReservationEventRecord>,
): ReservationEventRecord => value as ReservationEventRecord;
const toReservationRecord = (
  value: Partial<ReservationRecord>,
): ReservationRecord => value as ReservationRecord;

const hoursFromNowIso = (hours: number) => {
  const value = new Date(Date.now() + hours * 60 * 60 * 1000);
  value.setMinutes(0, 0, 0);
  return value.toISOString();
};

function createHarness() {
  const reservationRepositoryFns = {
    findById: vi.fn(async () => null),
    findOverlappingActiveByCoachIds: vi.fn(async () => []),
    create: vi.fn(async (data: Partial<ReservationRecord>) =>
      toReservationRecord({
        id: RESERVATION_ID,
        pingOwnerCount: 0,
        createdAt: new Date("2026-03-15T01:00:00.000Z"),
        updatedAt: new Date("2026-03-15T01:00:00.000Z"),
        ...data,
      }),
    ),
  };
  const reservationEventRepositoryFns = {
    findByReservationId: vi.fn(async () => []),
    create: vi.fn(async () =>
      toReservationEventRecord({
        id: "event-1",
        reservationId: RESERVATION_ID,
        toStatus: "CREATED",
      }),
    ),
  };
  const profileRepositoryFns = {
    findById: vi.fn(async () => null),
  };
  const coachRepositoryFns = {
    findByUserId: vi.fn(async () => null),
    findById: vi.fn(async () => null),
  };
  const coachHoursRepositoryFns = {
    findByCoachId: vi.fn(async () => []),
  };
  const coachRateRuleRepositoryFns = {
    findByCoachId: vi.fn(async () => []),
  };
  const coachAddonRepositoryFns = {
    findActiveByCoachIds: vi.fn(async () => []),
    findRateRulesByAddonIds: vi.fn(async () => []),
  };
  const coachBlockRepositoryFns = {
    findOverlappingByCoachId: vi.fn(async () => []),
  };
  const transactionManagerFns = {
    run: vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
      callback({}),
    ),
  };
  const notificationDeliveryServiceFns = {
    enqueueCoachBookingCreated: vi.fn(async () => ({ jobCount: 4 })),
    enqueuePlayerCoachBookingAwaitingPayment: vi.fn(async () => ({
      jobCount: 2,
    })),
    enqueueCoachBookingPaymentMarked: vi.fn(async () => ({ jobCount: 2 })),
    enqueuePlayerCoachBookingConfirmed: vi.fn(async () => ({ jobCount: 2 })),
    enqueuePlayerCoachBookingRejected: vi.fn(async () => ({ jobCount: 2 })),
    enqueueCoachBookingCancelled: vi.fn(async () => ({ jobCount: 2 })),
  };
  const paymentProofRepositoryFns = {
    findByReservationId: vi.fn(async () => null),
  };
  const storageServiceFns = {
    createSignedUrl: vi.fn(async () => "https://signed.example/proof.jpg"),
  };

  const service = new CoachReservationService(
    reservationRepositoryFns as unknown as CoachReservationServiceDeps[0],
    reservationEventRepositoryFns as unknown as CoachReservationServiceDeps[1],
    profileRepositoryFns as unknown as CoachReservationServiceDeps[2],
    coachRepositoryFns as unknown as CoachReservationServiceDeps[3],
    coachHoursRepositoryFns as unknown as CoachReservationServiceDeps[4],
    coachRateRuleRepositoryFns as unknown as CoachReservationServiceDeps[5],
    coachAddonRepositoryFns as unknown as CoachReservationServiceDeps[6],
    coachBlockRepositoryFns as unknown as CoachReservationServiceDeps[7],
    transactionManagerFns as unknown as CoachReservationServiceDeps[8],
    notificationDeliveryServiceFns as unknown as CoachReservationServiceDeps[9],
    paymentProofRepositoryFns as unknown as CoachReservationServiceDeps[10],
    storageServiceFns as unknown as CoachReservationServiceDeps[11],
  );

  return {
    service,
    reservationRepositoryFns,
    reservationEventRepositoryFns,
    profileRepositoryFns,
    coachRepositoryFns,
    coachHoursRepositoryFns,
    coachRateRuleRepositoryFns,
    coachAddonRepositoryFns,
    coachBlockRepositoryFns,
    transactionManagerFns,
    notificationDeliveryServiceFns,
    paymentProofRepositoryFns,
    storageServiceFns,
  };
}

describe("CoachReservationService.createForCoach", () => {
  it("rejects invalid selected add-ons before creating the reservation", async () => {
    const harness = createHarness();
    const startTime = hoursFromNowIso(48);
    const startDate = new Date(startTime);
    const dayOfWeek = startDate.getUTCDay();

    harness.profileRepositoryFns.findById.mockResolvedValue(
      toProfileRecord({
        id: PROFILE_ID,
        name: "Player One",
        email: "player@example.com",
        phone: "+63 900 000 0000",
        userId: "player-user-1",
      }),
    );
    harness.coachRepositoryFns.findById.mockResolvedValue(
      toCoachRecord({
        id: COACH_ID,
        isActive: true,
        name: "Coach Carla",
        timeZone: "UTC",
      }),
    );
    harness.coachHoursRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachHoursWindowRecord({
        coachId: COACH_ID,
        dayOfWeek,
        startMinute: 0,
        endMinute: 1440,
      }),
    ]);
    harness.coachRateRuleRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachRateRuleRecord({
        coachId: COACH_ID,
        dayOfWeek,
        startMinute: 0,
        endMinute: 1440,
        hourlyRateCents: 150000,
        currency: "PHP",
      }),
    ]);

    await expect(
      harness.service.createForCoach("player-user-1", PROFILE_ID, {
        coachId: COACH_ID,
        startTime,
        durationMinutes: 60,
        selectedAddons: [{ addonId: "missing-addon", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(InvalidReservationAddonSelectionError);

    expect(harness.reservationRepositoryFns.create).not.toHaveBeenCalled();
    expect(harness.transactionManagerFns.run).not.toHaveBeenCalled();
  });

  it("stores the pricing breakdown snapshot for selected coach add-ons", async () => {
    const harness = createHarness();
    const startTime = hoursFromNowIso(48);
    const startDate = new Date(startTime);
    const dayOfWeek = startDate.getUTCDay();
    const addon = toCoachAddonRecord({
      id: "addon-1",
      coachId: COACH_ID,
      label: "Warm-up drills",
      isActive: true,
      mode: "OPTIONAL",
      pricingType: "FLAT",
      flatFeeCents: 2000,
      flatFeeCurrency: "PHP",
      displayOrder: 0,
    });

    harness.profileRepositoryFns.findById.mockResolvedValue(
      toProfileRecord({
        id: PROFILE_ID,
        name: "Player One",
        email: "player@example.com",
        phone: "+63 900 000 0000",
        userId: "player-user-1",
      }),
    );
    harness.coachRepositoryFns.findById.mockResolvedValue(
      toCoachRecord({
        id: COACH_ID,
        isActive: true,
        name: "Coach Carla",
        timeZone: "UTC",
      }),
    );
    harness.coachHoursRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachHoursWindowRecord({
        coachId: COACH_ID,
        dayOfWeek,
        startMinute: 0,
        endMinute: 1440,
      }),
    ]);
    harness.coachRateRuleRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachRateRuleRecord({
        coachId: COACH_ID,
        dayOfWeek,
        startMinute: 0,
        endMinute: 1440,
        hourlyRateCents: 150000,
        currency: "PHP",
      }),
    ]);
    harness.coachAddonRepositoryFns.findActiveByCoachIds.mockResolvedValue([
      addon,
    ]);
    harness.coachAddonRepositoryFns.findRateRulesByAddonIds.mockResolvedValue([
      toCoachAddonRateRuleRecord({}),
    ]);

    const result = await harness.service.createForCoach(
      "player-user-1",
      PROFILE_ID,
      {
        coachId: COACH_ID,
        startTime,
        durationMinutes: 60,
        selectedAddons: [{ addonId: addon.id, quantity: 2 }],
      },
    );

    expect(harness.reservationRepositoryFns.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: COACH_ID,
        playerId: PROFILE_ID,
        totalPriceCents: 154000,
        currency: "PHP",
        pricingBreakdown: {
          basePriceCents: 150000,
          addonPriceCents: 4000,
          totalPriceCents: 154000,
          addons: [
            {
              addonId: addon.id,
              addonLabel: "Warm-up drills",
              pricingType: "FLAT",
              quantity: 2,
              subtotalCents: 4000,
            },
          ],
        },
      }),
      expect.objectContaining({ tx: {} }),
    );
    expect(result.totalPriceCents).toBe(154000);
    expect(result.currency).toBe("PHP");
    expect(harness.transactionManagerFns.run).toHaveBeenCalledTimes(1);
    expect(
      harness.notificationDeliveryServiceFns.enqueueCoachBookingCreated,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationId: RESERVATION_ID,
        coachId: COACH_ID,
        coachName: "Coach Carla",
        totalPriceCents: 154000,
        currency: "PHP",
        playerName: "Player One",
      }),
    );
  });
});

describe("CoachReservationService.getReservationDetail", () => {
  it("returns signed payment proof metadata for the owning coach", async () => {
    const harness = createHarness();
    const reservation = toReservationRecord({
      id: RESERVATION_ID,
      coachId: COACH_ID,
      status: "PAYMENT_MARKED_BY_USER",
    });
    const coach = toCoachRecord({
      id: COACH_ID,
      userId: USER_ID,
      name: "Coach Carla",
    });
    const proofCreatedAt = new Date("2026-03-15T02:00:00.000Z");
    const proof = toPaymentProofRecord({
      id: "proof-1",
      reservationId: RESERVATION_ID,
      referenceNumber: "GCASH-123",
      notes: "Sent via GCash",
      fileUrl: null,
      filePath: `${RESERVATION_ID}/proof.jpg`,
      createdAt: proofCreatedAt,
    });
    const event = toReservationEventRecord({
      id: "event-1",
      reservationId: RESERVATION_ID,
      toStatus: "PAYMENT_MARKED_BY_USER",
    });

    harness.reservationRepositoryFns.findById.mockResolvedValue(reservation);
    harness.coachRepositoryFns.findByUserId.mockResolvedValue(coach);
    harness.reservationEventRepositoryFns.findByReservationId.mockResolvedValue(
      [event],
    );
    harness.paymentProofRepositoryFns.findByReservationId.mockResolvedValue(
      proof,
    );

    const result = await harness.service.getReservationDetail(
      USER_ID,
      RESERVATION_ID,
    );

    expect(result.reservation).toBe(reservation);
    expect(result.events).toEqual([event]);
    expect(result.coach).toBe(coach);
    expect(result.paymentProof).toEqual({
      id: "proof-1",
      referenceNumber: "GCASH-123",
      notes: "Sent via GCash",
      fileUrl: "https://signed.example/proof.jpg",
      createdAt: proofCreatedAt.toISOString(),
    });
    expect(harness.storageServiceFns.createSignedUrl).toHaveBeenCalledWith(
      STORAGE_BUCKETS.PAYMENT_PROOFS,
      `${RESERVATION_ID}/proof.jpg`,
      300,
    );
  });

  it("returns null payment proof when the reservation has no uploaded proof", async () => {
    const harness = createHarness();
    const reservation = toReservationRecord({
      id: RESERVATION_ID,
      coachId: COACH_ID,
      status: "AWAITING_PAYMENT",
    });
    const coach = toCoachRecord({
      id: COACH_ID,
      userId: USER_ID,
      name: "Coach Carla",
    });

    harness.reservationRepositoryFns.findById.mockResolvedValue(reservation);
    harness.coachRepositoryFns.findByUserId.mockResolvedValue(coach);

    const result = await harness.service.getReservationDetail(
      USER_ID,
      RESERVATION_ID,
    );

    expect(result.paymentProof).toBeNull();
    expect(
      harness.paymentProofRepositoryFns.findByReservationId,
    ).toHaveBeenCalledWith(RESERVATION_ID);
    expect(harness.storageServiceFns.createSignedUrl).not.toHaveBeenCalled();
  });

  it("rejects access to another coach's reservation before loading proof data", async () => {
    const harness = createHarness();
    const reservation = toReservationRecord({
      id: RESERVATION_ID,
      coachId: "coach-2",
      status: "PAYMENT_MARKED_BY_USER",
    });
    const coach = toCoachRecord({
      id: COACH_ID,
      userId: USER_ID,
      name: "Coach Carla",
    });

    harness.reservationRepositoryFns.findById.mockResolvedValue(reservation);
    harness.coachRepositoryFns.findByUserId.mockResolvedValue(coach);

    await expect(
      harness.service.getReservationDetail(USER_ID, RESERVATION_ID),
    ).rejects.toBeInstanceOf(ReservationNotFoundError);

    expect(
      harness.paymentProofRepositoryFns.findByReservationId,
    ).not.toHaveBeenCalled();
    expect(
      harness.reservationEventRepositoryFns.findByReservationId,
    ).not.toHaveBeenCalled();
    expect(harness.storageServiceFns.createSignedUrl).not.toHaveBeenCalled();
  });
});
