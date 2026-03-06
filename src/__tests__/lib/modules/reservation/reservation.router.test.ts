import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/lib/modules/profile/errors/profile.errors";
import {
  NoAvailabilityError,
  NotReservationOwnerError,
  ReservationGroupNotFoundError,
  ReservationNotFoundError,
} from "@/lib/modules/reservation/errors/reservation.errors";

const TEST_IDS = {
  placeId: "33333333-3333-4333-8333-333333333333",
  courtId1: "44444444-4444-4444-8444-444444444444",
  courtId2: "55555555-5555-4555-8555-555555555555",
  sportId: "66666666-6666-4666-8666-666666666666",
  reservationGroupId: "77777777-7777-4777-8777-777777777777",
  reservationId1: "88888888-8888-4888-8888-888888888888",
  reservationId2: "99999999-9999-4999-8999-999999999999",
  profileId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};

const mockProfileService = {
  getOrCreateProfile: vi.fn(),
};

const mockReservationService = {
  createReservationForCourt: vi.fn(),
  createReservationForAnyCourt: vi.fn(),
  createReservationGroup: vi.fn(),
  markPayment: vi.fn(),
  markPaymentLinked: vi.fn(),
  cancelReservation: vi.fn(),
  getReservationById: vi.fn(),
  getReservationDetail: vi.fn(),
  getReservationLinkedDetail: vi.fn(),
  getPaymentInfo: vi.fn(),
  getMyReservations: vi.fn(),
  getMyReservationsWithDetails: vi.fn(),
};

vi.mock("@/lib/modules/profile/factories/profile.factory", () => ({
  makeProfileService: () => mockProfileService,
}));

vi.mock("@/lib/modules/reservation/factories/reservation.factory", () => ({
  makeReservationService: () => mockReservationService,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { reservationRouter } from "@/lib/modules/reservation/reservation.router";

const createCaller = () =>
  reservationRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: { userId: "user-1", email: "owner@example.com", role: "member" },
    userId: "user-1",
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as unknown,
  } as unknown as Parameters<typeof reservationRouter.createCaller>[0]);

const hoursFromNowIso = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("reservationRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileService.getOrCreateProfile.mockResolvedValue({
      id: TEST_IDS.profileId,
    });
  });

  it("createGroup valid payload -> calls createReservationGroup", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
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
    };
    mockReservationService.createReservationGroup.mockResolvedValue({
      reservationGroupId: TEST_IDS.reservationGroupId,
      totalPriceCents: 3000,
      currency: "PHP",
      items: [],
    });

    // Act
    const result = await caller.createGroup(input);

    // Assert
    expect(result).toMatchObject({
      reservationGroupId: TEST_IDS.reservationGroupId,
    });
    expect(mockReservationService.createReservationGroup).toHaveBeenCalledWith(
      "user-1",
      TEST_IDS.profileId,
      input,
    );
  });

  it("createForCourt legacy contract -> still calls createReservationForCourt", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      courtId: TEST_IDS.courtId1,
      startTime: hoursFromNowIso(2),
      durationMinutes: 60,
    };
    mockReservationService.createReservationForCourt.mockResolvedValue({
      id: TEST_IDS.reservationId1,
      status: "CREATED",
    });

    // Act
    const result = await caller.createForCourt(input);

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.reservationId1,
      status: "CREATED",
    });
    expect(
      mockReservationService.createReservationForCourt,
    ).toHaveBeenCalledWith("user-1", TEST_IDS.profileId, input);
    expect(mockProfileService.getOrCreateProfile).toHaveBeenCalledWith(
      "user-1",
    );
    expect(
      mockReservationService.createReservationGroup,
    ).not.toHaveBeenCalled();
  });

  it("createForCourt profile bootstrap missing -> maps to NOT_FOUND and skips reservation creation", async () => {
    // Arrange
    const caller = createCaller();
    mockProfileService.getOrCreateProfile.mockRejectedValue(
      new ProfileNotFoundError("user-1"),
    );

    // Act + Assert
    await expect(
      caller.createForCourt({
        courtId: TEST_IDS.courtId1,
        startTime: hoursFromNowIso(2),
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      mockReservationService.createReservationForCourt,
    ).not.toHaveBeenCalled();
  });

  it("createForCourt slot unavailable -> maps to BAD_REQUEST", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.createReservationForCourt.mockRejectedValue(
      new NoAvailabilityError({
        courtId: TEST_IDS.courtId1,
      }),
    );

    // Act + Assert
    await expect(
      caller.createForCourt({
        courtId: TEST_IDS.courtId1,
        startTime: hoursFromNowIso(2),
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("createForAnyCourt legacy contract -> still calls createReservationForAnyCourt", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      placeId: TEST_IDS.placeId,
      sportId: TEST_IDS.sportId,
      startTime: hoursFromNowIso(4),
      durationMinutes: 60,
    };
    mockReservationService.createReservationForAnyCourt.mockResolvedValue({
      id: TEST_IDS.reservationId1,
      status: "CREATED",
    });

    // Act
    const result = await caller.createForAnyCourt(input);

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.reservationId1,
      status: "CREATED",
    });
    expect(
      mockReservationService.createReservationForAnyCourt,
    ).toHaveBeenCalledWith("user-1", TEST_IDS.profileId, input);
    expect(
      mockReservationService.createReservationGroup,
    ).not.toHaveBeenCalled();
  });

  it("createForAnyCourt incomplete profile -> maps to BAD_REQUEST", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.createReservationForAnyCourt.mockRejectedValue(
      new IncompleteProfileError(),
    );

    // Act + Assert
    await expect(
      caller.createForAnyCourt({
        placeId: TEST_IDS.placeId,
        sportId: TEST_IDS.sportId,
        startTime: hoursFromNowIso(4),
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("markPayment valid payload -> calls markPayment", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      reservationId: TEST_IDS.reservationId1,
      termsAccepted: true as const,
    };
    mockReservationService.markPayment.mockResolvedValue({
      id: TEST_IDS.reservationId1,
      status: "PAYMENT_MARKED_BY_USER",
    });

    // Act
    const result = await caller.markPayment(input);

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.reservationId1,
      status: "PAYMENT_MARKED_BY_USER",
    });
    expect(mockReservationService.markPayment).toHaveBeenCalledWith(
      "user-1",
      TEST_IDS.profileId,
      input,
    );
  });

  it("markPayment ownership error -> maps to FORBIDDEN", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.markPayment.mockRejectedValue(
      new NotReservationOwnerError(),
    );

    // Act + Assert
    await expect(
      caller.markPayment({
        reservationId: TEST_IDS.reservationId1,
        termsAccepted: true,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("markPaymentLinked valid payload -> calls markPaymentLinked", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      reservationId: TEST_IDS.reservationId1,
      termsAccepted: true as const,
    };
    mockReservationService.markPaymentLinked.mockResolvedValue({
      reservationGroupId: TEST_IDS.reservationGroupId,
      reservations: [],
    });

    // Act
    const result = await caller.markPaymentLinked(input);

    // Assert
    expect(result).toEqual({
      reservationGroupId: TEST_IDS.reservationGroupId,
      reservations: [],
    });
    expect(mockReservationService.markPaymentLinked).toHaveBeenCalledWith(
      "user-1",
      TEST_IDS.profileId,
      input,
    );
  });

  it("markPaymentLinked group not found -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.markPaymentLinked.mockRejectedValue(
      new ReservationGroupNotFoundError(TEST_IDS.reservationGroupId),
    );

    // Act + Assert
    await expect(
      caller.markPaymentLinked({
        reservationId: TEST_IDS.reservationId1,
        termsAccepted: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("cancel valid payload -> calls cancelReservation", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      reservationId: TEST_IDS.reservationId1,
      reason: "Need to reschedule",
    };
    mockReservationService.cancelReservation.mockResolvedValue({
      id: TEST_IDS.reservationId1,
      status: "CANCELLED",
    });

    // Act
    const result = await caller.cancel(input);

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.reservationId1,
      status: "CANCELLED",
    });
    expect(mockReservationService.cancelReservation).toHaveBeenCalledWith(
      "user-1",
      TEST_IDS.profileId,
      input,
    );
  });

  it("getById valid payload -> calls getReservationById", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getReservationById.mockResolvedValue({
      reservation: { id: TEST_IDS.reservationId1 },
      events: [],
    });

    // Act
    const result = await caller.getById({
      reservationId: TEST_IDS.reservationId1,
    });

    // Assert
    expect(result).toMatchObject({
      reservation: { id: TEST_IDS.reservationId1 },
      events: [],
    });
    expect(mockReservationService.getReservationById).toHaveBeenCalledWith(
      TEST_IDS.reservationId1,
    );
  });

  it("getById domain not found -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getReservationById.mockRejectedValue(
      new ReservationNotFoundError(TEST_IDS.reservationId1),
    );

    // Act + Assert
    await expect(
      caller.getById({ reservationId: TEST_IDS.reservationId1 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("getDetail valid payload -> calls getReservationDetail", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getReservationDetail.mockResolvedValue({
      reservation: { id: TEST_IDS.reservationId1 },
      events: [],
      place: { id: TEST_IDS.placeId },
    });

    // Act
    const result = await caller.getDetail({
      reservationId: TEST_IDS.reservationId1,
    });

    // Assert
    expect(result).toMatchObject({
      reservation: { id: TEST_IDS.reservationId1 },
    });
    expect(mockReservationService.getReservationDetail).toHaveBeenCalledWith(
      TEST_IDS.reservationId1,
    );
  });

  it("getLinkedDetail valid payload -> calls getReservationLinkedDetail", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getReservationLinkedDetail.mockResolvedValue({
      reservationGroup: { id: TEST_IDS.reservationGroupId },
      statusSummary: {
        totalItems: 2,
        payableItems: 2,
        countsByStatus: {
          CREATED: 0,
          AWAITING_PAYMENT: 2,
          PAYMENT_MARKED_BY_USER: 0,
          CONFIRMED: 0,
          EXPIRED: 0,
          CANCELLED: 0,
        },
      },
      items: [],
    });

    // Act
    const result = await caller.getLinkedDetail({
      reservationId: TEST_IDS.reservationId1,
    });

    // Assert
    expect(result).toMatchObject({
      reservationGroup: { id: TEST_IDS.reservationGroupId },
    });
    expect(
      mockReservationService.getReservationLinkedDetail,
    ).toHaveBeenCalledWith("user-1", TEST_IDS.profileId, {
      reservationId: TEST_IDS.reservationId1,
    });
  });

  it("getPaymentInfo valid payload -> calls getPaymentInfo", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getPaymentInfo.mockResolvedValue({
      methods: [],
      defaultMethodId: null,
    });

    // Act
    const result = await caller.getPaymentInfo({
      reservationId: TEST_IDS.reservationId1,
    });

    // Assert
    expect(result).toEqual({ methods: [], defaultMethodId: null });
    expect(mockReservationService.getPaymentInfo).toHaveBeenCalledWith(
      "user-1",
      TEST_IDS.profileId,
      TEST_IDS.reservationId1,
    );
  });

  it("getPaymentInfo reservation not found -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationService.getPaymentInfo.mockRejectedValue(
      new ReservationNotFoundError(TEST_IDS.reservationId1),
    );

    // Act + Assert
    await expect(
      caller.getPaymentInfo({
        reservationId: TEST_IDS.reservationId1,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("getMy valid payload -> calls getMyReservations", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      status: "CREATED" as const,
      upcoming: true,
      limit: 10,
      offset: 0,
    };
    mockReservationService.getMyReservations.mockResolvedValue([]);

    // Act
    const result = await caller.getMy(input);

    // Assert
    expect(result).toEqual([]);
    expect(mockReservationService.getMyReservations).toHaveBeenCalledWith(
      TEST_IDS.profileId,
      input,
    );
  });

  it("getMyWithDetails valid payload -> calls getMyReservationsWithDetails", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      upcoming: false,
      limit: 20,
      offset: 0,
    };
    mockReservationService.getMyReservationsWithDetails.mockResolvedValue([]);

    // Act
    const result = await caller.getMyWithDetails(input);

    // Assert
    expect(result).toEqual([]);
    expect(
      mockReservationService.getMyReservationsWithDetails,
    ).toHaveBeenCalledWith(TEST_IDS.profileId, input);
  });
});
