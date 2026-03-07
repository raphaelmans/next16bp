import { describe, expect, it, vi } from "vitest";
import type {
  CreateReservationForAnyCourtDTO,
  CreateReservationForCourtDTO,
} from "@/lib/modules/reservation/dtos";
import { InvalidReservationAddonSelectionError } from "@/lib/modules/reservation/errors/reservation.errors";
import { ReservationService } from "@/lib/modules/reservation/services/reservation.service";
import type {
  CourtAddonRecord,
  CourtRecord,
  PlaceAddonRecord,
  PlaceRecord,
  PlaceVerificationRecord,
} from "@/lib/shared/infra/db/schema";

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_ADDON_PRICING_V2: true,
  },
}));

vi.mock("@/lib/modules/chat/ops/post-player-created-message", () => ({
  postPlayerCreatedMessage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/modules/chat/ops/post-player-payment-marked-message", () => ({
  postPlayerPaymentMarkedMessage: vi.fn(async () => undefined),
}));

const COURT_ID = "court-1";
const PLACE_ID = "place-1";
const SPORT_ID = "sport-1";
const PROFILE_ID = "profile-1";
const USER_ID = "user-1";

type ReservationServiceDeps = ConstructorParameters<typeof ReservationService>;

const toCourtRecord = (value: Partial<CourtRecord>): CourtRecord =>
  value as CourtRecord;
const toPlaceRecord = (value: Partial<PlaceRecord>): PlaceRecord =>
  value as PlaceRecord;
const toVerificationRecord = (
  value: Partial<PlaceVerificationRecord>,
): PlaceVerificationRecord => value as PlaceVerificationRecord;
const toCourtAddonRecord = (
  value: Partial<CourtAddonRecord>,
): CourtAddonRecord => value as CourtAddonRecord;
const toPlaceAddonRecord = (
  value: Partial<PlaceAddonRecord>,
): PlaceAddonRecord => value as PlaceAddonRecord;

const createHarness = (options?: {
  courtAddonIds?: string[];
  venueAddonIds?: string[];
}) => {
  const courtAddons = (options?.courtAddonIds ?? ["court-addon-1"]).map((id) =>
    toCourtAddonRecord({
      id,
      courtId: COURT_ID,
      isActive: true,
    }),
  );
  const venueAddons = (options?.venueAddonIds ?? ["venue-addon-1"]).map((id) =>
    toPlaceAddonRecord({
      id,
      placeId: PLACE_ID,
      isActive: true,
    }),
  );

  const court = toCourtRecord({
    id: COURT_ID,
    label: "Court 1",
    placeId: PLACE_ID,
    sportId: SPORT_ID,
    isActive: true,
  });
  const place = toPlaceRecord({
    id: PLACE_ID,
    name: "Place 1",
    timeZone: "Asia/Manila",
    placeType: "RESERVABLE",
    isActive: true,
  });
  const verification = toVerificationRecord({
    placeId: PLACE_ID,
    status: "VERIFIED",
    reservationsEnabled: true,
  });

  const reservationRepositoryFns = {
    findOverlappingActiveByCourtIds: vi.fn(async () => []),
  };
  const reservationEventRepositoryFns = {
    create: vi.fn(async () => undefined),
  };
  const profileRepositoryFns = {
    findById: vi.fn(async () => null),
  };
  const courtRepositoryFns = {
    findById: vi.fn(async () => court),
    findByPlaceAndSport: vi.fn(async () => [court]),
  };
  const placeRepositoryFns = {
    findById: vi.fn(async () => place),
  };
  const placePhotoRepositoryFns = {
    findByPlaceId: vi.fn(async () => []),
  };
  const placeVerificationRepositoryFns = {
    findByPlaceId: vi.fn(async () => verification),
  };
  const organizationReservationPolicyRepositoryFns = {
    ensureForOrganization: vi.fn(async () => null),
  };
  const organizationPaymentMethodRepositoryFns = {
    findActiveByOrganizationId: vi.fn(async () => []),
  };
  const organizationRepositoryFns = {
    findById: vi.fn(async () => null),
  };
  const organizationProfileRepositoryFns = {
    findByOrganizationId: vi.fn(async () => null),
  };
  const courtHoursRepositoryFns = {
    findByCourtIds: vi.fn(async () => []),
  };
  const courtRateRuleRepositoryFns = {
    findByCourtIds: vi.fn(async () => []),
  };
  const courtAddonRepositoryFns = {
    findActiveByCourtIds: vi.fn(async () => courtAddons),
    findRateRulesByAddonIds: vi.fn(async () => []),
  };
  const placeAddonRepositoryFns = {
    findActiveByPlaceId: vi.fn(async () => venueAddons),
    findRateRulesByAddonIds: vi.fn(async () => []),
  };
  const courtBlockRepositoryFns = {
    findOverlappingByCourtIds: vi.fn(async () => []),
  };
  const courtPriceOverrideRepositoryFns = {
    findOverlappingByCourtIds: vi.fn(async () => []),
  };
  const run = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({}));
  const notificationDeliveryServiceFns = {
    enqueueOwnerReservationCreated: vi.fn(async () => undefined),
    enqueueOwnerReservationPaymentMarked: vi.fn(async () => undefined),
  };
  const availabilityChangeEventServiceFns = {
    emitReservationBooked: vi.fn(async () => undefined),
    emitReservationReleased: vi.fn(async () => undefined),
  };

  const service = new ReservationService(
    reservationRepositoryFns as unknown as ReservationServiceDeps[0],
    reservationEventRepositoryFns as unknown as ReservationServiceDeps[1],
    profileRepositoryFns as unknown as ReservationServiceDeps[2],
    courtRepositoryFns as unknown as ReservationServiceDeps[3],
    placeRepositoryFns as unknown as ReservationServiceDeps[4],
    placePhotoRepositoryFns as unknown as ReservationServiceDeps[5],
    placeVerificationRepositoryFns as unknown as ReservationServiceDeps[6],
    organizationReservationPolicyRepositoryFns as unknown as ReservationServiceDeps[7],
    organizationPaymentMethodRepositoryFns as unknown as ReservationServiceDeps[8],
    organizationRepositoryFns as unknown as ReservationServiceDeps[9],
    organizationProfileRepositoryFns as unknown as ReservationServiceDeps[10],
    courtHoursRepositoryFns as unknown as ReservationServiceDeps[11],
    courtRateRuleRepositoryFns as unknown as ReservationServiceDeps[12],
    courtAddonRepositoryFns as unknown as ReservationServiceDeps[13],
    placeAddonRepositoryFns as unknown as ReservationServiceDeps[14],
    courtBlockRepositoryFns as unknown as ReservationServiceDeps[15],
    courtPriceOverrideRepositoryFns as unknown as ReservationServiceDeps[16],
    { run } as unknown as ReservationServiceDeps[17],
    notificationDeliveryServiceFns as unknown as ReservationServiceDeps[18],
    availabilityChangeEventServiceFns as unknown as ReservationServiceDeps[19],
  );

  return {
    service,
    run,
    courtRepositoryFns,
  };
};

const getFutureStartTimeIso = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe("ReservationService addon selection validation", () => {
  it("createReservationForCourt rejects add-ons that are not allowed for the court or venue", async () => {
    const harness = createHarness();
    const payload: CreateReservationForCourtDTO = {
      courtId: COURT_ID,
      startTime: getFutureStartTimeIso(),
      durationMinutes: 60,
      selectedAddons: [{ addonId: "invalid-addon", quantity: 1 }],
    };

    await expect(
      harness.service.createReservationForCourt(USER_ID, PROFILE_ID, payload),
    ).rejects.toBeInstanceOf(InvalidReservationAddonSelectionError);
    expect(harness.run).not.toHaveBeenCalled();
  });

  it("createReservationForAnyCourt rejects when selected add-ons are invalid for all candidate courts", async () => {
    const harness = createHarness();
    const payload: CreateReservationForAnyCourtDTO = {
      placeId: PLACE_ID,
      sportId: SPORT_ID,
      startTime: getFutureStartTimeIso(),
      durationMinutes: 60,
      selectedAddons: [{ addonId: "invalid-addon", quantity: 1 }],
    };

    await expect(
      harness.service.createReservationForAnyCourt(
        USER_ID,
        PROFILE_ID,
        payload,
      ),
    ).rejects.toBeInstanceOf(InvalidReservationAddonSelectionError);
    expect(harness.courtRepositoryFns.findByPlaceAndSport).toHaveBeenCalledWith(
      PLACE_ID,
      SPORT_ID,
    );
    expect(harness.run).not.toHaveBeenCalled();
  });
});
