import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import { PlaceNotBookableError } from "@/lib/modules/place-verification/errors/place-verification.errors";
import { IncompleteProfileError } from "@/lib/modules/profile/errors/profile.errors";
import {
  InvalidReservationStatusError,
  NoAvailabilityError,
  NotReservationOwnerError,
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
  groupExists?: boolean;
  groupReservations?: ReservationRecord[];
  groupPlayerId?: string | null;
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

  const groupExists = overrides?.groupExists ?? true;
  const groupPlayerId = overrides?.groupPlayerId ?? TEST_IDS.profileId;

  let reservationSeq = 0;
  const now = new Date();
  const defaultGroupReservations: ReservationRecord[] = [
    {
      id: "group-res-1",
      courtId: TEST_IDS.courtId1,
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      totalPriceCents: 1500,
      currency: "PHP",
      playerId: TEST_IDS.profileId,
      groupId: "group-1",
      guestProfileId: null,
      playerNameSnapshot: "Player",
      playerEmailSnapshot: "player@example.com",
      playerPhoneSnapshot: "0917",
      status: "AWAITING_PAYMENT",
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      termsAcceptedAt: null,
      confirmedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "group-res-2",
      courtId: TEST_IDS.courtId2,
      startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      totalPriceCents: 2500,
      currency: "PHP",
      playerId: TEST_IDS.profileId,
      groupId: "group-1",
      guestProfileId: null,
      playerNameSnapshot: "Player",
      playerEmailSnapshot: "player@example.com",
      playerPhoneSnapshot: "0917",
      status: "AWAITING_PAYMENT",
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      termsAcceptedAt: null,
      confirmedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const groupReservations =
    overrides?.groupReservations ?? defaultGroupReservations;
  const groupReservationById = new Map(
    groupReservations.map((item) => [item.id, item]),
  );
  const courtById = new Map(courts.map((court) => [court.id, court]));

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
    update: vi
      .fn()
      .mockImplementation((id: string, payload: Record<string, unknown>) => {
        const existing = groupReservationById.get(id);
        const updated = {
          ...(existing ?? defaultGroupReservations[0]),
          ...payload,
          id,
          updatedAt: new Date(),
        } satisfies ReservationRecord;
        groupReservationById.set(id, updated);
        return Promise.resolve(updated);
      }),
    findGroupById: vi.fn().mockResolvedValue(
      groupExists
        ? {
            id: "group-1",
            placeId: TEST_IDS.placeId,
            playerId: groupPlayerId,
            playerNameSnapshot: "Player",
            playerEmailSnapshot: "player@example.com",
            playerPhoneSnapshot: "0917",
            totalPriceCents: 4000,
            currency: "PHP",
            createdAt: now,
            updatedAt: now,
          }
        : null,
    ),
    findGroupByIdForUpdate: vi.fn().mockResolvedValue(
      groupExists
        ? {
            id: "group-1",
            placeId: TEST_IDS.placeId,
            playerId: groupPlayerId,
            playerNameSnapshot: "Player",
            playerEmailSnapshot: "player@example.com",
            playerPhoneSnapshot: "0917",
            totalPriceCents: 4000,
            currency: "PHP",
            createdAt: now,
            updatedAt: now,
          }
        : null,
    ),
    findByGroupId: vi.fn().mockResolvedValue(groupReservations),
    findByGroupIdForUpdate: vi.fn().mockResolvedValue(groupReservations),
    findGroupItemsWithCourtAndPlace: vi.fn().mockResolvedValue(
      groupReservations
        .map((reservation) => {
          const court = courtById.get(reservation.courtId);
          if (!court || !place) return null;
          return {
            reservation,
            court: {
              id: court.id,
              label: court.label,
              placeId: court.placeId,
              isActive: court.isActive,
            },
            place: {
              id: place.id,
              name: place.name,
              address: "Address",
              city: "City",
              timeZone: place.timeZone,
              placeType: place.placeType,
              isActive: place.isActive,
              organizationId: place.organizationId,
            },
          };
        })
        .filter((item) => item !== null),
    ),
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

  const placeAddonRepository = {
    findActiveByPlaceId: vi.fn().mockResolvedValue([]),
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
    enqueueOwnerReservationGroupCreated: vi.fn().mockResolvedValue(undefined),
    enqueueOwnerReservationPaymentMarked: vi.fn().mockResolvedValue(undefined),
    enqueueOwnerReservationGroupPaymentMarked: vi
      .fn()
      .mockResolvedValue(undefined),
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
    placeAddonRepository as never,
    courtBlockRepository as never,
    courtPriceOverrideRepository as never,
    transactionManager as never,
    notificationDeliveryService as never,
  );

  return {
    service,
    reservationRepository,
    reservationEventRepository,
    profileRepository,
    placeRepository,
    notificationDeliveryService,
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
    const { service, reservationRepository, notificationDeliveryService } =
      makeReservationService({
        place: {
          id: TEST_IDS.placeId,
          name: "Test Place",
          placeType: "RESERVABLE",
          isActive: true,
          timeZone: "Asia/Manila",
          organizationId: "org-1",
        },
      });

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
    expect(
      vi.mocked(
        notificationDeliveryService.enqueueOwnerReservationGroupCreated,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(notificationDeliveryService.enqueueOwnerReservationCreated),
    ).not.toHaveBeenCalled();
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

describe("ReservationService.markPaymentGroup", () => {
  it("marks all payable group reservations atomically", async () => {
    // Arrange
    const {
      service,
      reservationRepository,
      reservationEventRepository,
      notificationDeliveryService,
    } = makeReservationService({
      place: {
        id: TEST_IDS.placeId,
        name: "Test Place",
        placeType: "RESERVABLE",
        isActive: true,
        timeZone: "Asia/Manila",
        organizationId: "org-1",
      },
    });

    // Act
    const result = await service.markPaymentGroup(
      "user-1",
      TEST_IDS.profileId,
      {
        reservationGroupId: "group-1",
        termsAccepted: true,
      },
    );

    // Assert
    expect(result.reservationGroupId).toBe("group-1");
    expect(result.reservations).toHaveLength(2);
    expect(
      result.reservations.every(
        (reservation) => reservation.status === "PAYMENT_MARKED_BY_USER",
      ),
    ).toBe(true);
    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(reservationEventRepository.create)).toHaveBeenCalledTimes(
      2,
    );
    expect(
      vi.mocked(
        notificationDeliveryService.enqueueOwnerReservationGroupPaymentMarked,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueueOwnerReservationPaymentMarked,
      ),
    ).not.toHaveBeenCalled();
  });

  it("fails without partial updates when one group item is not payable-ready", async () => {
    // Arrange
    const now = new Date();
    const { service, reservationRepository } = makeReservationService({
      groupReservations: [
        {
          id: "group-res-1",
          courtId: TEST_IDS.courtId1,
          startTime: now,
          endTime: new Date(now.getTime() + 60 * 60 * 1000),
          totalPriceCents: 1500,
          currency: "PHP",
          playerId: TEST_IDS.profileId,
          groupId: "group-1",
          guestProfileId: null,
          playerNameSnapshot: "Player",
          playerEmailSnapshot: "player@example.com",
          playerPhoneSnapshot: "0917",
          status: "AWAITING_PAYMENT",
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          termsAcceptedAt: null,
          confirmedAt: null,
          cancelledAt: null,
          cancellationReason: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "group-res-2",
          courtId: TEST_IDS.courtId2,
          startTime: now,
          endTime: new Date(now.getTime() + 60 * 60 * 1000),
          totalPriceCents: 2500,
          currency: "PHP",
          playerId: TEST_IDS.profileId,
          groupId: "group-1",
          guestProfileId: null,
          playerNameSnapshot: "Player",
          playerEmailSnapshot: "player@example.com",
          playerPhoneSnapshot: "0917",
          status: "CREATED",
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          termsAcceptedAt: null,
          confirmedAt: null,
          cancelledAt: null,
          cancellationReason: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    // Act + Assert
    await expect(
      service.markPaymentGroup("user-1", TEST_IDS.profileId, {
        reservationGroupId: "group-1",
        termsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(InvalidReservationStatusError);
    expect(vi.mocked(reservationRepository.update)).not.toHaveBeenCalled();
  });
});

describe("ReservationService.getReservationGroupDetail", () => {
  it("returns grouped reservation detail with status summary", async () => {
    // Arrange
    const { service } = makeReservationService();

    // Act
    const result = await service.getReservationGroupDetail(
      "user-1",
      TEST_IDS.profileId,
      {
        reservationGroupId: "group-1",
      },
    );

    // Assert
    expect(result.reservationGroup.id).toBe("group-1");
    expect(result.items).toHaveLength(2);
    expect(result.statusSummary.totalItems).toBe(2);
    expect(result.statusSummary.payableItems).toBe(2);
    expect(result.statusSummary.countsByStatus.AWAITING_PAYMENT).toBe(2);
  });

  it("rejects when requesting player does not own the reservation group", async () => {
    // Arrange
    const { service } = makeReservationService({
      groupPlayerId: "different-profile",
    });

    // Act + Assert
    await expect(
      service.getReservationGroupDetail("user-1", TEST_IDS.profileId, {
        reservationGroupId: "group-1",
      }),
    ).rejects.toBeInstanceOf(NotReservationOwnerError);
  });
});
