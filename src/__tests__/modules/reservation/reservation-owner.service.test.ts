import { describe, expect, it, vi } from "vitest";
import {
  InvalidReservationStatusError,
  ReservationExpiredError,
  ReservationGroupNotFoundError,
} from "@/lib/modules/reservation/errors/reservation.errors";
import { ReservationOwnerService } from "@/lib/modules/reservation/services/reservation-owner.service";

vi.mock("@/lib/modules/chat/ops/post-owner-confirmed-message", () => ({
  postOwnerConfirmedMessage: vi.fn(),
}));

type GroupReservationStub = {
  id: string;
  courtId: string;
  status:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  totalPriceCents: number;
  expiresAt?: Date | null;
};

function makeOwnerService(overrides?: {
  groupExists?: boolean;
  groupReservations?: GroupReservationStub[];
}) {
  const groupExists = overrides?.groupExists ?? true;
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);

  const groupReservations = overrides?.groupReservations ?? [
    {
      id: "res-1",
      courtId: "court-1",
      status: "CREATED",
      totalPriceCents: 0,
      expiresAt: futureExpiry,
    },
    {
      id: "res-2",
      courtId: "court-2",
      status: "CREATED",
      totalPriceCents: 0,
      expiresAt: futureExpiry,
    },
  ];

  const reservationById = new Map(
    groupReservations.map((reservation) => [reservation.id, reservation]),
  );

  const now = new Date();

  const reservationRepository = {
    findGroupByIdForUpdate: vi
      .fn()
      .mockResolvedValue(groupExists ? { id: "group-1" } : null),
    findByGroupIdForUpdate: vi.fn().mockResolvedValue(
      groupReservations.map((item) => ({
        id: item.id,
        courtId: item.courtId,
        status: item.status,
        totalPriceCents: item.totalPriceCents,
        currency: "PHP",
        playerId: "profile-1",
        guestProfileId: null,
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        expiresAt: item.expiresAt ?? futureExpiry,
        termsAcceptedAt: null,
        confirmedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        playerNameSnapshot: "Player",
        playerEmailSnapshot: "player@example.com",
        playerPhoneSnapshot: "0917",
        createdAt: now,
        updatedAt: now,
      })),
    ),
    update: vi
      .fn()
      .mockImplementation((id: string, payload: Record<string, unknown>) => {
        const base = reservationById.get(id);
        return Promise.resolve({
          id,
          courtId: base?.courtId ?? "court-1",
          status: (payload.status as string) ?? base?.status ?? "CONFIRMED",
          totalPriceCents: base?.totalPriceCents ?? 0,
          currency: "PHP",
          playerId: "profile-1",
          guestProfileId: null,
          startTime: now,
          endTime: new Date(now.getTime() + 60 * 60 * 1000),
          expiresAt:
            (payload.expiresAt as Date | null | undefined) ??
            base?.expiresAt ??
            null,
          termsAcceptedAt: null,
          confirmedAt: (payload.confirmedAt as Date | null | undefined) ?? now,
          cancelledAt: (payload.cancelledAt as Date | null | undefined) ?? null,
          cancellationReason:
            (payload.cancellationReason as string | null | undefined) ?? null,
          playerNameSnapshot: "Player",
          playerEmailSnapshot: "player@example.com",
          playerPhoneSnapshot: "0917",
          createdAt: now,
          updatedAt: now,
        });
      }),
  };

  const reservationEventRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    createMany: vi.fn().mockResolvedValue([]),
    findByReservationId: vi.fn().mockResolvedValue([]),
  };

  const notificationDeliveryService = {
    enqueuePlayerReservationAwaitingPayment: vi
      .fn()
      .mockResolvedValue(undefined),
    enqueuePlayerReservationGroupAwaitingPayment: vi
      .fn()
      .mockResolvedValue(undefined),
    enqueuePlayerReservationConfirmed: vi.fn().mockResolvedValue(undefined),
    enqueuePlayerReservationGroupConfirmed: vi
      .fn()
      .mockResolvedValue(undefined),
    enqueuePlayerReservationRejected: vi.fn().mockResolvedValue(undefined),
    enqueuePlayerReservationGroupRejected: vi.fn().mockResolvedValue(undefined),
  };

  const service = new ReservationOwnerService(
    reservationRepository as never,
    reservationEventRepository as never,
    {
      findById: vi.fn().mockImplementation((courtId: string) =>
        Promise.resolve({
          id: courtId,
          placeId: "place-1",
          label: courtId === "court-1" ? "Court 1" : "Court 2",
        }),
      ),
    } as never,
    {
      findById: vi.fn().mockResolvedValue({
        id: "place-1",
        name: "Place 1",
        organizationId: "org-1",
      }),
    } as never,
    {
      findById: vi.fn().mockResolvedValue({
        id: "profile-1",
        userId: "player-user-1",
      }),
    } as never,
    {
      ensureForOrganization: vi.fn().mockResolvedValue({
        paymentHoldMinutes: 45,
      }),
    } as never,
    {
      findById: vi.fn().mockResolvedValue({
        id: "org-1",
        ownerUserId: "owner-user-1",
      }),
    } as never,
    {
      run: vi
        .fn()
        .mockImplementation(async (fn: (tx: object) => unknown) => fn({})),
    } as never,
    {
      executeForOrganization: vi.fn().mockResolvedValue(undefined),
    } as never,
    notificationDeliveryService as never,
  );

  return {
    service,
    reservationRepository,
    reservationEventRepository,
    notificationDeliveryService,
  };
}

describe("ReservationOwnerService group actions", () => {
  it("acceptReservationGroup confirms all free reservations", async () => {
    // Arrange
    const { service, reservationRepository, notificationDeliveryService } =
      makeOwnerService();

    // Act
    const updated = await service.acceptReservationGroup("owner-user-1", {
      reservationGroupId: "group-1",
    });

    // Assert
    expect(updated).toHaveLength(2);
    expect(updated.every((item) => item.status === "CONFIRMED")).toBe(true);
    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueuePlayerReservationGroupConfirmed,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(notificationDeliveryService.enqueuePlayerReservationConfirmed),
    ).not.toHaveBeenCalled();
  });

  it("acceptReservationGroup moves paid reservations to AWAITING_PAYMENT", async () => {
    // Arrange
    const { service, reservationRepository, notificationDeliveryService } =
      makeOwnerService({
        groupReservations: [
          {
            id: "res-1",
            courtId: "court-1",
            status: "CREATED",
            totalPriceCents: 1000,
          },
          {
            id: "res-2",
            courtId: "court-2",
            status: "CREATED",
            totalPriceCents: 2000,
          },
        ],
      });

    // Act
    const updated = await service.acceptReservationGroup("owner-user-1", {
      reservationGroupId: "group-1",
    });

    // Assert
    expect(updated.every((item) => item.status === "AWAITING_PAYMENT")).toBe(
      true,
    );
    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(2);
    expect(
      vi
        .mocked(reservationRepository.update)
        .mock.calls.every(
          ([, payload]) => payload.status === "AWAITING_PAYMENT",
        ),
    ).toBe(true);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueuePlayerReservationGroupAwaitingPayment,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueuePlayerReservationAwaitingPayment,
      ),
    ).not.toHaveBeenCalled();
  });

  it("acceptReservationGroup fails when one reservation is expired", async () => {
    // Arrange
    const { service } = makeOwnerService({
      groupReservations: [
        {
          id: "res-1",
          courtId: "court-1",
          status: "CREATED",
          totalPriceCents: 0,
          expiresAt: new Date(Date.now() - 60 * 1000),
        },
      ],
    });

    // Act + Assert
    await expect(
      service.acceptReservationGroup("owner-user-1", {
        reservationGroupId: "group-1",
      }),
    ).rejects.toBeInstanceOf(ReservationExpiredError);
  });

  it("acceptReservationGroup fails when one reservation is not in CREATED", async () => {
    // Arrange
    const { service, reservationRepository } = makeOwnerService({
      groupReservations: [
        {
          id: "res-1",
          courtId: "court-1",
          status: "CREATED",
          totalPriceCents: 0,
        },
        {
          id: "res-2",
          courtId: "court-2",
          status: "CONFIRMED",
          totalPriceCents: 0,
        },
      ],
    });

    // Act + Assert
    await expect(
      service.acceptReservationGroup("owner-user-1", {
        reservationGroupId: "group-1",
      }),
    ).rejects.toBeInstanceOf(InvalidReservationStatusError);

    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(1);
    expect(
      vi
        .mocked(reservationRepository.update)
        .mock.calls.some(([id]) => id === "res-2"),
    ).toBe(false);
  });

  it("confirmPaymentGroup confirms PAYMENT_MARKED_BY_USER reservations", async () => {
    // Arrange
    const { service, reservationRepository, notificationDeliveryService } =
      makeOwnerService({
        groupReservations: [
          {
            id: "res-1",
            courtId: "court-1",
            status: "PAYMENT_MARKED_BY_USER",
            totalPriceCents: 1200,
          },
          {
            id: "res-2",
            courtId: "court-2",
            status: "PAYMENT_MARKED_BY_USER",
            totalPriceCents: 1400,
          },
        ],
      });

    // Act
    const updated = await service.confirmPaymentGroup("owner-user-1", {
      reservationGroupId: "group-1",
      notes: "Batch confirmed",
    });

    // Assert
    expect(updated).toHaveLength(2);
    expect(updated.every((item) => item.status === "CONFIRMED")).toBe(true);
    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueuePlayerReservationGroupConfirmed,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(notificationDeliveryService.enqueuePlayerReservationConfirmed),
    ).not.toHaveBeenCalled();
  });

  it("confirmPaymentGroup fails when one reservation is not PAYMENT_MARKED_BY_USER", async () => {
    // Arrange
    const { service, reservationRepository } = makeOwnerService({
      groupReservations: [
        {
          id: "res-1",
          courtId: "court-1",
          status: "AWAITING_PAYMENT",
          totalPriceCents: 1200,
        },
      ],
    });

    // Act + Assert
    await expect(
      service.confirmPaymentGroup("owner-user-1", {
        reservationGroupId: "group-1",
        notes: "Batch confirmed",
      }),
    ).rejects.toBeInstanceOf(InvalidReservationStatusError);

    expect(vi.mocked(reservationRepository.update)).not.toHaveBeenCalled();
  });

  it("rejectReservationGroup cancels all allowed statuses", async () => {
    // Arrange
    const { service, reservationRepository, notificationDeliveryService } =
      makeOwnerService({
        groupReservations: [
          {
            id: "res-1",
            courtId: "court-1",
            status: "CREATED",
            totalPriceCents: 0,
          },
          {
            id: "res-2",
            courtId: "court-2",
            status: "AWAITING_PAYMENT",
            totalPriceCents: 1200,
          },
          {
            id: "res-3",
            courtId: "court-2",
            status: "PAYMENT_MARKED_BY_USER",
            totalPriceCents: 1200,
          },
        ],
      });

    // Act
    const updated = await service.rejectReservationGroup("owner-user-1", {
      reservationGroupId: "group-1",
      reason: "Owner cannot host this schedule",
    });

    // Assert
    expect(updated).toHaveLength(3);
    expect(updated.every((item) => item.status === "CANCELLED")).toBe(true);
    expect(vi.mocked(reservationRepository.update)).toHaveBeenCalledTimes(3);
    expect(
      vi.mocked(
        notificationDeliveryService.enqueuePlayerReservationGroupRejected,
      ),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(notificationDeliveryService.enqueuePlayerReservationRejected),
    ).not.toHaveBeenCalled();
  });

  it("rejectReservationGroup fails for disallowed status", async () => {
    // Arrange
    const { service, reservationRepository } = makeOwnerService({
      groupReservations: [
        {
          id: "res-1",
          courtId: "court-1",
          status: "CONFIRMED",
          totalPriceCents: 0,
        },
      ],
    });

    // Act + Assert
    await expect(
      service.rejectReservationGroup("owner-user-1", {
        reservationGroupId: "group-1",
        reason: "Cannot proceed",
      }),
    ).rejects.toBeInstanceOf(InvalidReservationStatusError);

    expect(vi.mocked(reservationRepository.update)).not.toHaveBeenCalled();
  });

  it("fails when reservation group does not exist", async () => {
    // Arrange
    const { service } = makeOwnerService({ groupExists: false });

    // Act + Assert
    await expect(
      service.acceptReservationGroup("owner-user-1", {
        reservationGroupId: "group-1",
      }),
    ).rejects.toBeInstanceOf(ReservationGroupNotFoundError);
  });
});
