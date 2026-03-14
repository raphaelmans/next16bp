import { describe, expect, it, vi } from "vitest";
import type {
  CreateReservationForAnyCourtDTO,
  CreateReservationForCourtDTO,
} from "@/lib/modules/reservation/dtos";
import { InvalidReservationAddonSelectionError } from "@/lib/modules/reservation/errors/reservation.errors";
import { ReservationService } from "@/lib/modules/reservation/services/reservation.service";
import type {
  CoachPaymentMethodRecord,
  CourtAddonRecord,
  CourtRecord,
  OrganizationPaymentMethodRecord,
  PlaceAddonRecord,
  PlaceRecord,
  PlaceVerificationRecord,
  ReservationRecord,
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
const COACH_ID = "coach-1";
const PROFILE_ID = "profile-1";
const USER_ID = "user-1";
const RESERVATION_ID = "reservation-1";

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
const toReservationRecord = (
  value: Partial<ReservationRecord>,
): ReservationRecord => value as ReservationRecord;
const toCoachPaymentMethodRecord = (
  value: Partial<CoachPaymentMethodRecord>,
): CoachPaymentMethodRecord => value as CoachPaymentMethodRecord;
const toOrganizationPaymentMethodRecord = (
  value: Partial<OrganizationPaymentMethodRecord>,
): OrganizationPaymentMethodRecord => value as OrganizationPaymentMethodRecord;

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
    findById: vi.fn(async () => null),
  };
  const reservationEventRepositoryFns = {
    create: vi.fn(async () => undefined),
  };
  const profileRepositoryFns = {
    findById: vi.fn(async () => null),
  };
  const coachRepositoryFns = {
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
    findByOrganizationId: vi.fn(async () => []),
  };
  const coachPaymentMethodRepositoryFns = {
    findByCoachId: vi.fn(async () => []),
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
    coachRepositoryFns as unknown as ReservationServiceDeps[3],
    courtRepositoryFns as unknown as ReservationServiceDeps[4],
    placeRepositoryFns as unknown as ReservationServiceDeps[5],
    placePhotoRepositoryFns as unknown as ReservationServiceDeps[6],
    placeVerificationRepositoryFns as unknown as ReservationServiceDeps[7],
    organizationReservationPolicyRepositoryFns as unknown as ReservationServiceDeps[8],
    organizationPaymentMethodRepositoryFns as unknown as ReservationServiceDeps[9],
    coachPaymentMethodRepositoryFns as unknown as ReservationServiceDeps[10],
    organizationRepositoryFns as unknown as ReservationServiceDeps[11],
    organizationProfileRepositoryFns as unknown as ReservationServiceDeps[12],
    courtHoursRepositoryFns as unknown as ReservationServiceDeps[13],
    courtRateRuleRepositoryFns as unknown as ReservationServiceDeps[14],
    courtAddonRepositoryFns as unknown as ReservationServiceDeps[15],
    placeAddonRepositoryFns as unknown as ReservationServiceDeps[16],
    courtBlockRepositoryFns as unknown as ReservationServiceDeps[17],
    courtPriceOverrideRepositoryFns as unknown as ReservationServiceDeps[18],
    { run } as unknown as ReservationServiceDeps[19],
    notificationDeliveryServiceFns as unknown as ReservationServiceDeps[20],
    availabilityChangeEventServiceFns as unknown as ReservationServiceDeps[21],
  );

  return {
    service,
    run,
    reservationRepositoryFns,
    coachPaymentMethodRepositoryFns,
    organizationPaymentMethodRepositoryFns,
    courtRepositoryFns,
    placeRepositoryFns,
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

describe("ReservationService.getPaymentInfo", () => {
  it("returns active coach payment methods for coach reservations", async () => {
    const harness = createHarness();
    harness.reservationRepositoryFns.findById.mockResolvedValue(
      toReservationRecord({
        id: RESERVATION_ID,
        playerId: PROFILE_ID,
        coachId: COACH_ID,
        courtId: null,
        status: "AWAITING_PAYMENT",
      }),
    );
    harness.coachPaymentMethodRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachPaymentMethodRecord({
        id: "coach-method-default",
        coachId: COACH_ID,
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach Alex",
        accountNumber: "09171234567",
        instructions: "Send proof after payment",
        isActive: true,
        isDefault: true,
      }),
      toCoachPaymentMethodRecord({
        id: "coach-method-disabled",
        coachId: COACH_ID,
        type: "BANK",
        provider: "BPI",
        accountName: "Coach Alex",
        accountNumber: "1234567890",
        instructions: null,
        isActive: false,
        isDefault: false,
      }),
    ]);

    const result = await harness.service.getPaymentInfo(
      USER_ID,
      PROFILE_ID,
      RESERVATION_ID,
    );

    expect(result).toEqual({
      methods: [
        {
          id: "coach-method-default",
          type: "MOBILE_WALLET",
          provider: "GCASH",
          accountName: "Coach Alex",
          accountNumber: "09171234567",
          instructions: "Send proof after payment",
          isDefault: true,
        },
      ],
      defaultMethodId: "coach-method-default",
    });
    expect(
      harness.coachPaymentMethodRepositoryFns.findByCoachId,
    ).toHaveBeenCalledWith(COACH_ID);
    expect(harness.courtRepositoryFns.findById).not.toHaveBeenCalled();
    expect(
      harness.organizationPaymentMethodRepositoryFns.findByOrganizationId,
    ).not.toHaveBeenCalled();
  });

  it("returns active organization payment methods for venue reservations", async () => {
    const harness = createHarness();
    harness.reservationRepositoryFns.findById.mockResolvedValue(
      toReservationRecord({
        id: RESERVATION_ID,
        playerId: PROFILE_ID,
        coachId: null,
        courtId: COURT_ID,
        status: "PAYMENT_MARKED_BY_USER",
      }),
    );
    harness.placeRepositoryFns.findById.mockResolvedValue(
      toPlaceRecord({
        id: PLACE_ID,
        organizationId: "org-1",
        name: "Place 1",
        timeZone: "Asia/Manila",
        placeType: "RESERVABLE",
        isActive: true,
      }),
    );
    harness.organizationPaymentMethodRepositoryFns.findByOrganizationId.mockResolvedValue(
      [
        toOrganizationPaymentMethodRecord({
          id: "org-method-default",
          organizationId: "org-1",
          type: "BANK",
          provider: "BPI",
          accountName: "Venue Owner",
          accountNumber: "9876543210",
          instructions: "Pay before arrival",
          isActive: true,
          isDefault: true,
        }),
        toOrganizationPaymentMethodRecord({
          id: "org-method-disabled",
          organizationId: "org-1",
          type: "MOBILE_WALLET",
          provider: "MAYA",
          accountName: "Venue Owner",
          accountNumber: "09998887777",
          instructions: null,
          isActive: false,
          isDefault: false,
        }),
      ],
    );

    const result = await harness.service.getPaymentInfo(
      USER_ID,
      PROFILE_ID,
      RESERVATION_ID,
    );

    expect(result).toEqual({
      methods: [
        {
          id: "org-method-default",
          type: "BANK",
          provider: "BPI",
          accountName: "Venue Owner",
          accountNumber: "9876543210",
          instructions: "Pay before arrival",
          isDefault: true,
        },
      ],
      defaultMethodId: "org-method-default",
    });
    expect(
      harness.organizationPaymentMethodRepositoryFns.findByOrganizationId,
    ).toHaveBeenCalledWith("org-1");
    expect(
      harness.coachPaymentMethodRepositoryFns.findByCoachId,
    ).not.toHaveBeenCalled();
  });

  it("returns an empty coach payment payload when all coach methods are inactive", async () => {
    const harness = createHarness();
    harness.reservationRepositoryFns.findById.mockResolvedValue(
      toReservationRecord({
        id: RESERVATION_ID,
        playerId: PROFILE_ID,
        coachId: COACH_ID,
        courtId: null,
        status: "AWAITING_PAYMENT",
      }),
    );
    harness.coachPaymentMethodRepositoryFns.findByCoachId.mockResolvedValue([
      toCoachPaymentMethodRecord({
        id: "coach-method-disabled",
        coachId: COACH_ID,
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach Alex",
        accountNumber: "09170000000",
        instructions: null,
        isActive: false,
        isDefault: true,
      }),
    ]);

    await expect(
      harness.service.getPaymentInfo(USER_ID, PROFILE_ID, RESERVATION_ID),
    ).resolves.toEqual({
      methods: [],
      defaultMethodId: null,
    });
  });
});
