import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import { PlaceNotBookableError } from "@/lib/modules/place-verification/errors/place-verification.errors";
import { IncompleteProfileError } from "@/lib/modules/profile/errors/profile.errors";
import {
  NoAvailabilityError,
  ReservationGroupInvalidError,
} from "@/lib/modules/reservation/errors/reservation.errors";
import { ReservationService } from "@/lib/modules/reservation/services/reservation.service";
import type { ReservationRecord } from "@/lib/shared/infra/db/schema";
import { computeSchedulePriceDetailed } from "@/lib/shared/lib/schedule-availability";

vi.mock("@/lib/modules/chat/ops/post-player-created-message", () => ({
  postPlayerCreatedMessage: vi.fn(),
}));

vi.mock("@/lib/modules/chat/ops/post-player-payment-marked-message", () => ({
  postPlayerPaymentMarkedMessage: vi.fn(),
}));

vi.mock("@/lib/shared/lib/schedule-availability", () => ({
  computeSchedulePriceDetailed: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_ADDON_PRICING_V2: true,
  },
}));

const mockedComputeSchedulePriceDetailed = vi.mocked(
  computeSchedulePriceDetailed,
);

const hoursFromNowIso = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const TEST_IDS = {
  placeId: "place-1",
  placeIdOther: "place-2",
  courtId1: "court-1",
  courtId2: "court-2",
  profileId: "profile-1",
};

type CourtStub = {
  id: string;
  label: string;
  placeId: string;
  isActive: boolean;
};

type PlaceStub = {
  id: string;
  name: string;
  placeType: "RESERVABLE";
  isActive: boolean;
  timeZone: string;
  organizationId: string | null;
};

type ProfileStub = {
  id: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

function makeReservationService(overrides?: {
  courts?: CourtStub[];
  place?: PlaceStub | null;
  profile?: ProfileStub | null;
  placeVerification?: {
    status: "VERIFIED" | "PENDING";
    reservationsEnabled: boolean;
  } | null;
}) {
  const courts = overrides?.courts ?? [
    {
      id: TEST_IDS.courtId1,
      label: "Court 1",
      placeId: TEST_IDS.placeId,
      isActive: true,
    },
    {
      id: TEST_IDS.courtId2,
      label: "Court 2",
      placeId: TEST_IDS.placeId,
      isActive: true,
    },
  ];

  const defaultPlace = {
    id: TEST_IDS.placeId,
    name: "Test Place",
    placeType: "RESERVABLE" as const,
    isActive: true,
    timeZone: "Asia/Manila",
    organizationId: null,
  };
  const place =
    overrides && Object.hasOwn(overrides, "place")
      ? (overrides.place ?? null)
      : defaultPlace;

  const profile = overrides?.profile ?? {
    id: TEST_IDS.profileId,
    userId: "user-1",
    displayName: "Player",
    email: "player@example.com",
    phoneNumber: "0917",
  };

  const placeVerification = overrides?.placeVerification ?? {
    status: "VERIFIED" as const,
    reservationsEnabled: true,
  };

  let reservationSeq = 0;
  const now = new Date();

  const reservationRepository = {
    findOverlappingActiveByCourtIds: vi.fn().mockResolvedValue([]),
    createGroup: vi.fn().mockResolvedValue({
      id: "group-1",
      placeId: TEST_IDS.placeId,
      playerId: TEST_IDS.profileId,
      playerNameSnapshot: "Player",
      playerEmailSnapshot: "player@example.com",
      playerPhoneSnapshot: "0917",
      totalPriceCents: 4000,
      currency: "PHP",
      createdAt: now,
      updatedAt: now,
    }),
    create: vi.fn().mockImplementation((input) => {
      reservationSeq += 1;
      return Promise.resolve({
        id: `res-${reservationSeq}`,
        groupId: input.groupId ?? null,
        courtId: input.courtId,
        startTime: input.startTime,
        endTime: input.endTime,
        totalPriceCents: input.totalPriceCents,
        currency: input.currency,
        playerId: input.playerId,
        guestProfileId: null,
        playerNameSnapshot: input.playerNameSnapshot,
        playerEmailSnapshot: input.playerEmailSnapshot,
        playerPhoneSnapshot: input.playerPhoneSnapshot,
        status: input.status,
        expiresAt: input.expiresAt ?? null,
        termsAcceptedAt: null,
        confirmedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: now,
        updatedAt: now,
      } satisfies ReservationRecord);
    }),
    findByIdForUpdate: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findByPlayerId: vi.fn(),
    findWithDetailsByPlayerId: vi.fn(),
    findWithDetailsByOrganization: vi.fn(),
  };

  const reservationEventRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    createMany: vi.fn().mockResolvedValue([]),
    findByReservationId: vi.fn().mockResolvedValue([]),
  };

  const profileRepository = {
    findById: vi.fn().mockResolvedValue(profile),
  };

  const courtRepository = {
    findByIds: vi.fn().mockResolvedValue(courts),
    findById: vi
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve(courts.find((court) => court.id === id) ?? null),
      ),
    findByPlaceAndSport: vi.fn().mockResolvedValue([]),
  };

  const placeRepository = {
    findById: vi
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve(place && id === place.id ? place : null),
      ),
  };

  const placePhotoRepository = {
    findByPlaceId: vi.fn().mockResolvedValue([]),
  };

  const placeVerificationRepository = {
    findByPlaceId: vi.fn().mockResolvedValue(placeVerification),
  };

  const organizationReservationPolicyRepository = {
    ensureForOrganization: vi.fn().mockResolvedValue(null),
    findByOrganizationId: vi.fn().mockResolvedValue(null),
  };

  const organizationPaymentMethodRepository = {
    findByOrganizationId: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
  };

  const organizationRepository = {
    findById: vi.fn().mockResolvedValue(null),
    findByOrganizationId: vi.fn().mockResolvedValue([]),
  };

  const organizationProfileRepository = {
    findByOrganizationId: vi.fn().mockResolvedValue(null),
  };

  const courtHoursRepository = {
    findByCourtIds: vi.fn().mockResolvedValue([]),
  };

  const courtRateRuleRepository = {
    findByCourtIds: vi.fn().mockResolvedValue([]),
  };

  const courtAddonRepository = {
    findActiveByCourtIds: vi.fn().mockResolvedValue([]),
    findRateRulesByAddonIds: vi.fn().mockResolvedValue([]),
  };

  const courtBlockRepository = {
    findOverlappingByCourtIds: vi.fn().mockResolvedValue([]),
  };

  const courtPriceOverrideRepository = {
    findOverlappingByCourtIds: vi.fn().mockResolvedValue([]),
  };

  const transactionManager = {
    run: vi
      .fn()
      .mockImplementation(async (fn: (tx: object) => unknown) => fn({})),
  };

  const notificationDeliveryService = {
    enqueueOwnerReservationCreated: vi.fn().mockResolvedValue(undefined),
    enqueueOwnerReservationPaymentMarked: vi.fn().mockResolvedValue(undefined),
    enqueueOwnerReservationCancelled: vi.fn().mockResolvedValue(undefined),
  };

  const service = new ReservationService(
    reservationRepository as never,
    reservationEventRepository as never,
    profileRepository as never,
    courtRepository as never,
    placeRepository as never,
    placePhotoRepository as never,
    placeVerificationRepository as never,
    organizationReservationPolicyRepository as never,
    organizationPaymentMethodRepository as never,
    organizationRepository as never,
    organizationProfileRepository as never,
    courtHoursRepository as never,
    courtRateRuleRepository as never,
    courtAddonRepository as never,
    courtBlockRepository as never,
    courtPriceOverrideRepository as never,
    transactionManager as never,
    notificationDeliveryService as never,
  );

  return {
    service,
    reservationRepository,
    profileRepository,
    placeRepository,
  };
}

describe("ReservationService.createReservationGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedComputeSchedulePriceDetailed.mockImplementation(
      ({ startTime, durationMinutes }) => ({
        result: {
          startTime,
          endTime: new Date(startTime.getTime() + durationMinutes * 60_000),
          totalPriceCents: 2000,
          currency: "PHP",
          warnings: [],
        },
        failureReason: null,
      }),
    );
  });

  it("creates grouped reservations in one request", async () => {
    // Arrange
    const { service, reservationRepository } = makeReservationService();

    // Act
    const result = await service.createReservationGroup("user-1", "profile-1", {
      placeId: TEST_IDS.placeId,
      items: [
        {
          courtId: TEST_IDS.courtId1,
          startTime: hoursFromNowIso(2),
          durationMinutes: 60,
        },
        {
          courtId: TEST_IDS.courtId2,
          startTime: hoursFromNowIso(3),
          durationMinutes: 60,
        },
      ],
    });

    // Assert
    expect(result.reservationGroupId).toBe("group-1");
    expect(result.totalPriceCents).toBe(4000);
    expect(result.items).toHaveLength(2);
    expect(
      vi
        .mocked(reservationRepository.create)
        .mock.calls.map(([input]) => input.groupId),
    ).toEqual(["group-1", "group-1"]);
  });

  it("rejects duplicate court-time-duration items", async () => {
    // Arrange
    const { service, reservationRepository } = makeReservationService();
    const duplicateStart = hoursFromNowIso(4);

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: duplicateStart,
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId1,
            startTime: duplicateStart,
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ReservationGroupInvalidError);

    expect(reservationRepository.createGroup).not.toHaveBeenCalled();
  });

  it("rejects when place does not exist", async () => {
    // Arrange
    const { service } = makeReservationService({ place: null });

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(PlaceNotFoundError);
  });

  it("rejects when place is not bookable", async () => {
    // Arrange
    const { service } = makeReservationService({
      placeVerification: {
        status: "PENDING",
        reservationsEnabled: false,
      },
    });

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(PlaceNotBookableError);
  });

  it("rejects when one court belongs to a different place", async () => {
    // Arrange
    const { service, reservationRepository } = makeReservationService({
      courts: [
        {
          id: TEST_IDS.courtId1,
          label: "Court 1",
          placeId: TEST_IDS.placeId,
          isActive: true,
        },
        {
          id: TEST_IDS.courtId2,
          label: "Court 2",
          placeId: TEST_IDS.placeIdOther,
          isActive: true,
        },
      ],
    });

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ReservationGroupInvalidError);

    expect(reservationRepository.createGroup).not.toHaveBeenCalled();
  });

  it("rejects when pricing cannot be computed for an item", async () => {
    // Arrange
    mockedComputeSchedulePriceDetailed.mockReturnValue({
      result: null,
      failureReason: "NO_RATE_RULE_MATCH",
    } as never);
    const { service } = makeReservationService();

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NoAvailabilityError);
  });

  it("rejects mixed currencies across group items", async () => {
    // Arrange
    mockedComputeSchedulePriceDetailed
      .mockImplementationOnce(({ startTime, durationMinutes }) => ({
        result: {
          startTime,
          endTime: new Date(startTime.getTime() + durationMinutes * 60_000),
          totalPriceCents: 2000,
          currency: "PHP",
          warnings: [],
        },
        failureReason: null,
      }))
      .mockImplementationOnce(({ startTime, durationMinutes }) => ({
        result: {
          startTime,
          endTime: new Date(startTime.getTime() + durationMinutes * 60_000),
          totalPriceCents: 2500,
          currency: "USD",
          warnings: [],
        },
        failureReason: null,
      }));
    const { service, reservationRepository } = makeReservationService();

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ReservationGroupInvalidError);

    expect(reservationRepository.createGroup).not.toHaveBeenCalled();
  });

  it("rejects when availability changes inside transaction", async () => {
    // Arrange
    mockedComputeSchedulePriceDetailed.mockImplementation(
      ({ startTime, durationMinutes }) => ({
        result: {
          startTime,
          endTime: new Date(startTime.getTime() + durationMinutes * 60_000),
          totalPriceCents: 2000,
          currency: "PHP",
          warnings: [],
        },
        failureReason: null,
      }),
    );
    const { service, reservationRepository } = makeReservationService();

    vi.mocked(reservationRepository.findOverlappingActiveByCourtIds)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ courtId: TEST_IDS.courtId1 }] as never);

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NoAvailabilityError);
  });

  it("rejects when profile is incomplete", async () => {
    // Arrange
    mockedComputeSchedulePriceDetailed.mockImplementation(
      ({ startTime, durationMinutes }) => ({
        result: {
          startTime,
          endTime: new Date(startTime.getTime() + durationMinutes * 60_000),
          totalPriceCents: 2000,
          currency: "PHP",
          warnings: [],
        },
        failureReason: null,
      }),
    );
    const { service, profileRepository, reservationRepository } =
      makeReservationService({
        profile: {
          id: TEST_IDS.profileId,
          userId: "user-1",
          displayName: null,
          email: null,
          phoneNumber: null,
        },
      });

    // Act + Assert
    await expect(
      service.createReservationGroup("user-1", "profile-1", {
        placeId: TEST_IDS.placeId,
        items: [
          {
            courtId: TEST_IDS.courtId1,
            startTime: hoursFromNowIso(2),
            durationMinutes: 60,
          },
          {
            courtId: TEST_IDS.courtId2,
            startTime: hoursFromNowIso(3),
            durationMinutes: 60,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(IncompleteProfileError);

    expect(vi.mocked(profileRepository.findById)).toHaveBeenCalled();
    expect(reservationRepository.createGroup).not.toHaveBeenCalled();
  });
});
