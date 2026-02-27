import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationDeliveryService } from "@/lib/modules/notification-delivery/services/notification-delivery.service";

vi.mock("next/server", () => ({
  after: (fn: () => void | Promise<void>) => void fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NOTIFICATION_EMAIL_ENABLED: true,
    NOTIFICATION_SMS_ENABLED: true,
    NOTIFICATION_WEB_PUSH_ENABLED: true,
    NOTIFICATION_MOBILE_PUSH_ENABLED: true,
  },
}));

function makeService() {
  const jobRepository = {
    createMany: vi.fn(async (jobs: unknown[]) => jobs),
  };

  const recipientRepository = {
    findAdminRecipients: vi.fn(),
    findOwnerRecipientByOrganizationId: vi.fn(),
    findPlayerRecipientByReservationId: vi.fn(),
    findOwnerRecipientByReservationId: vi.fn(),
    findOwnerRecipientByPlaceVerificationRequestId: vi.fn(),
    findOwnerRecipientByClaimRequestId: vi.fn(),
    listOrganizationRecipientsByUserIds: vi.fn(
      async (organizationId: string, userIds: string[]) =>
        userIds.map((userId) => ({
          organizationId,
          userId,
          email: "owner@example.com",
          phoneNumber: "09171234567",
        })),
    ),
  };

  const pushSubscriptionRepository = {
    listActiveByUserId: vi.fn(async () => [{ id: "web-1" }]),
  };

  const mobilePushTokenRepository = {
    listActiveByUserId: vi.fn(async () => [{ id: "mob-1" }]),
  };
  const userNotificationRepository = {
    createMany: vi.fn(async (rows: unknown[]) => rows),
  };

  const dispatchTriggerQueue = {
    publishDispatchKick: vi.fn(async () => undefined),
  };

  const organizationMemberService = {
    listOrganizationUserIdsForReservationNotifications: vi.fn(async () => [
      "owner-1",
    ]),
  };

  const service = new NotificationDeliveryService(
    jobRepository as never,
    recipientRepository as never,
    pushSubscriptionRepository as never,
    mobilePushTokenRepository as never,
    userNotificationRepository as never,
    dispatchTriggerQueue as never,
    organizationMemberService as never,
  );

  return {
    service,
    jobRepository,
    recipientRepository,
    pushSubscriptionRepository,
    mobilePushTokenRepository,
    dispatchTriggerQueue,
    userNotificationRepository,
    organizationMemberService,
  };
}

const groupItems = [
  {
    reservationId: "res-1",
    courtId: "court-1",
    courtLabel: "Court 1",
    startTimeIso: "2026-03-01T08:00:00.000Z",
    endTimeIso: "2026-03-01T09:00:00.000Z",
    totalPriceCents: 1200,
    currency: "PHP",
    expiresAtIso: "2026-02-28T10:00:00.000Z",
  },
  {
    reservationId: "res-2",
    courtId: "court-2",
    courtLabel: "Court 2",
    startTimeIso: "2026-03-01T10:00:00.000Z",
    endTimeIso: "2026-03-01T11:00:00.000Z",
    totalPriceCents: 1800,
    currency: "PHP",
    expiresAtIso: "2026-02-28T10:00:00.000Z",
  },
];

describe("NotificationDeliveryService reservation group events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueueOwnerReservationGroupCreated -> enqueues group-scoped idempotent jobs", async () => {
    // Arrange
    const { service, jobRepository, userNotificationRepository } =
      makeService();

    // Act
    await service.enqueueOwnerReservationGroupCreated({
      reservationGroupId: "group-1",
      representativeReservationId: "res-1",
      organizationId: "org-1",
      placeId: "place-1",
      placeName: "Place A",
      totalPriceCents: 3000,
      currency: "PHP",
      playerName: "Player A",
      playerEmail: "player@example.com",
      playerPhone: "09170000000",
      itemCount: 2,
      startTimeIso: "2026-03-01T08:00:00.000Z",
      endTimeIso: "2026-03-01T11:00:00.000Z",
      expiresAtIso: "2026-02-28T10:00:00.000Z",
      items: groupItems,
    });

    // Assert
    expect(jobRepository.createMany).toHaveBeenCalledTimes(1);
    const jobs = vi.mocked(jobRepository.createMany).mock
      .calls[0]?.[0] as Array<{
      eventType: string;
      idempotencyKey: string;
      payload: Record<string, unknown>;
    }>;
    expect(jobs).toHaveLength(4);
    expect(
      jobs.every((job) => job.eventType === "reservation_group.created"),
    ).toBe(true);
    expect(
      jobs.every((job) =>
        job.idempotencyKey.startsWith(
          "reservation_group.created:group-1:org:org-1",
        ),
      ),
    ).toBe(true);
    expect(
      jobs.every((job) => job.payload.reservationGroupId === "group-1"),
    ).toBe(true);
    expect(userNotificationRepository.createMany).toHaveBeenCalledTimes(1);
  });

  it("enqueuePlayerReservationGroupAwaitingPayment -> uses group id for idempotency key", async () => {
    // Arrange
    const {
      service,
      jobRepository,
      recipientRepository,
      userNotificationRepository,
    } = makeService();
    vi.mocked(
      recipientRepository.findPlayerRecipientByReservationId,
    ).mockResolvedValue({
      userId: "player-1",
      email: "player@example.com",
      phoneNumber: "09170000000",
    });

    // Act
    await service.enqueuePlayerReservationGroupAwaitingPayment({
      reservationGroupId: "group-1",
      representativeReservationId: "res-1",
      placeName: "Place A",
      courtLabel: "2 courts",
      startTimeIso: "2026-03-01T08:00:00.000Z",
      endTimeIso: "2026-03-01T11:00:00.000Z",
      expiresAtIso: "2026-02-28T10:00:00.000Z",
      totalPriceCents: 3000,
      currency: "PHP",
      itemCount: 2,
      items: groupItems,
    });

    // Assert
    expect(jobRepository.createMany).toHaveBeenCalledTimes(1);
    const jobs = vi.mocked(jobRepository.createMany).mock
      .calls[0]?.[0] as Array<{
      eventType: string;
      idempotencyKey: string;
    }>;
    expect(jobs).toHaveLength(2);
    expect(
      jobs.every(
        (job) =>
          job.eventType === "reservation_group.awaiting_payment" &&
          job.idempotencyKey.includes(
            "reservation_group.awaiting_payment:group-1",
          ),
      ),
    ).toBe(true);
    expect(userNotificationRepository.createMany).toHaveBeenCalledTimes(1);
  });

  it("enqueueOwnerReservationGroupPaymentMarked -> routes through owner organization recipient", async () => {
    // Arrange
    const { service, jobRepository, userNotificationRepository } =
      makeService();

    // Act
    await service.enqueueOwnerReservationGroupPaymentMarked({
      reservationGroupId: "group-1",
      representativeReservationId: "res-1",
      organizationId: "org-1",
      placeName: "Place A",
      courtLabel: "2 courts",
      startTimeIso: "2026-03-01T08:00:00.000Z",
      endTimeIso: "2026-03-01T11:00:00.000Z",
      playerName: "Player A",
      itemCount: 2,
      items: groupItems,
    });

    // Assert
    expect(jobRepository.createMany).toHaveBeenCalledTimes(1);
    const jobs = vi.mocked(jobRepository.createMany).mock
      .calls[0]?.[0] as Array<{
      eventType: string;
      idempotencyKey: string;
    }>;
    expect(jobs).toHaveLength(2);
    expect(
      jobs.every(
        (job) =>
          job.eventType === "reservation_group.payment_marked" &&
          job.idempotencyKey.includes(
            "reservation_group.payment_marked:group-1",
          ),
      ),
    ).toBe(true);
    expect(userNotificationRepository.createMany).toHaveBeenCalledTimes(1);
  });

  it("enqueueOwnerReservationGroupCreated -> does not fail when dispatch kick publish fails", async () => {
    const { service, dispatchTriggerQueue } = makeService();
    vi.mocked(dispatchTriggerQueue.publishDispatchKick).mockRejectedValue(
      new Error("QStash publish failed"),
    );

    await expect(
      service.enqueueOwnerReservationGroupCreated({
        reservationGroupId: "group-1",
        representativeReservationId: "res-1",
        organizationId: "org-1",
        placeId: "place-1",
        placeName: "Place A",
        totalPriceCents: 3000,
        currency: "PHP",
        playerName: "Player A",
        playerEmail: "player@example.com",
        playerPhone: "09170000000",
        itemCount: 2,
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        expiresAtIso: "2026-02-28T10:00:00.000Z",
        items: groupItems,
      }),
    ).resolves.toEqual({ jobCount: 4 });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dispatchTriggerQueue.publishDispatchKick).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "jobs_enqueued",
        jobCount: 4,
      }),
    );
  });

  it("owner lifecycle notifications are skipped when no members opted in", async () => {
    const { service, jobRepository, organizationMemberService } = makeService();
    vi.mocked(
      organizationMemberService.listOrganizationUserIdsForReservationNotifications,
    ).mockResolvedValue([]);

    await expect(
      service.enqueueOwnerReservationGroupCreated({
        reservationGroupId: "group-1",
        representativeReservationId: "res-1",
        organizationId: "org-1",
        placeId: "place-1",
        placeName: "Place A",
        totalPriceCents: 3000,
        currency: "PHP",
        playerName: "Player A",
        playerEmail: "player@example.com",
        playerPhone: "09170000000",
        itemCount: 2,
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T11:00:00.000Z",
        expiresAtIso: "2026-02-28T10:00:00.000Z",
        items: groupItems,
      }),
    ).resolves.toEqual({ jobCount: 0 });

    expect(jobRepository.createMany).not.toHaveBeenCalled();
  });

  it("enqueueOwnerReservationCreated fans out jobs and inbox rows to multiple opted-in recipients", async () => {
    const {
      service,
      organizationMemberService,
      jobRepository,
      userNotificationRepository,
    } = makeService();
    vi.mocked(
      organizationMemberService.listOrganizationUserIdsForReservationNotifications,
    ).mockResolvedValue(["owner-1", "manager-1"]);

    await expect(
      service.enqueueOwnerReservationCreated({
        reservationId: "res-1",
        organizationId: "org-1",
        placeId: "place-1",
        placeName: "Place A",
        courtId: "court-1",
        courtLabel: "Court 1",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T09:00:00.000Z",
        totalPriceCents: 1500,
        currency: "PHP",
        playerName: "Player A",
        playerEmail: "player@example.com",
        playerPhone: "09170000000",
        expiresAtIso: "2026-02-28T10:00:00.000Z",
      }),
    ).resolves.toEqual({ jobCount: 8 });

    expect(jobRepository.createMany).toHaveBeenCalledTimes(1);
    const jobs = vi.mocked(jobRepository.createMany).mock
      .calls[0]?.[0] as Array<{ idempotencyKey: string; eventType: string }>;

    expect(jobs).toHaveLength(8);
    expect(jobs.every((job) => job.eventType === "reservation.created")).toBe(
      true,
    );
    expect(
      jobs.some((job) => job.idempotencyKey.includes(":user:owner-1:email")),
    ).toBe(true);
    expect(
      jobs.some((job) => job.idempotencyKey.includes(":user:manager-1:email")),
    ).toBe(true);
    expect(userNotificationRepository.createMany).toHaveBeenCalledTimes(2);
  });

  it("enqueueOwnerReservationPing returns pinged false when no members are opted in", async () => {
    const { service, organizationMemberService, jobRepository } = makeService();
    vi.mocked(
      organizationMemberService.listOrganizationUserIdsForReservationNotifications,
    ).mockResolvedValue([]);

    await expect(
      service.enqueueOwnerReservationPing({
        reservationId: "res-1",
        organizationId: "org-1",
        placeName: "Place A",
        courtLabel: "Court 1",
        playerName: "Player A",
        startTimeIso: "2026-03-01T08:00:00.000Z",
        endTimeIso: "2026-03-01T09:00:00.000Z",
      }),
    ).resolves.toEqual({ pinged: false });

    expect(jobRepository.createMany).not.toHaveBeenCalled();
  });
});
