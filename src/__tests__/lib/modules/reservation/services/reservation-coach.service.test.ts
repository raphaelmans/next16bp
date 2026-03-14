import { describe, expect, it, vi } from "vitest";
import { ReservationNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";
import { CoachReservationService } from "@/lib/modules/reservation/services/reservation-coach.service";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type {
  CoachRecord,
  PaymentProofRecord,
  ReservationEventRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";

type CoachReservationServiceDeps = ConstructorParameters<
  typeof CoachReservationService
>;

const USER_ID = "coach-user-1";
const COACH_ID = "coach-1";
const RESERVATION_ID = "reservation-1";

const toCoachRecord = (value: Partial<CoachRecord>): CoachRecord =>
  value as CoachRecord;
const toPaymentProofRecord = (
  value: Partial<PaymentProofRecord>,
): PaymentProofRecord => value as PaymentProofRecord;
const toReservationEventRecord = (
  value: Partial<ReservationEventRecord>,
): ReservationEventRecord => value as ReservationEventRecord;
const toReservationRecord = (
  value: Partial<ReservationRecord>,
): ReservationRecord => value as ReservationRecord;

function createHarness() {
  const reservationRepositoryFns = {
    findById: vi.fn(async () => null),
  };
  const reservationEventRepositoryFns = {
    findByReservationId: vi.fn(async () => []),
  };
  const profileRepositoryFns = {};
  const coachRepositoryFns = {
    findByUserId: vi.fn(async () => null),
  };
  const coachHoursRepositoryFns = {};
  const coachRateRuleRepositoryFns = {};
  const coachAddonRepositoryFns = {};
  const coachBlockRepositoryFns = {};
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
    { run: vi.fn() } as unknown as CoachReservationServiceDeps[8],
    paymentProofRepositoryFns as unknown as CoachReservationServiceDeps[9],
    storageServiceFns as unknown as CoachReservationServiceDeps[10],
  );

  return {
    service,
    reservationRepositoryFns,
    reservationEventRepositoryFns,
    coachRepositoryFns,
    paymentProofRepositoryFns,
    storageServiceFns,
  };
}

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
