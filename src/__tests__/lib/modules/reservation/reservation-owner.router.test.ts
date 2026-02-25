import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourtBlockOverlapError } from "@/lib/modules/court-block/errors/court-block.errors";
import { ReservationGroupNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";

const TEST_IDS = {
  ownerUserId: "11111111-1111-4111-8111-111111111111",
  organizationId: "12121212-1212-4121-8121-121212121212",
  reservationGroupId: "22222222-2222-4222-8222-222222222222",
  reservationId: "33333333-3333-4333-8333-333333333333",
  courtId: "44444444-4444-4444-8444-444444444444",
  paymentMethodId: "55555555-5555-4555-8555-555555555555",
  guestProfileId: "66666666-6666-4666-8666-666666666666",
  blockId: "77777777-7777-4777-8777-777777777777",
};

const mockReservationOwnerService = {
  acceptReservation: vi.fn(),
  acceptReservationGroup: vi.fn(),
  confirmPayment: vi.fn(),
  confirmPaymentGroup: vi.fn(),
  confirmPaidOffline: vi.fn(),
  rejectReservation: vi.fn(),
  rejectReservationGroup: vi.fn(),
  createGuestBooking: vi.fn(),
  convertWalkInBlockToGuest: vi.fn(),
  getActiveForCourtRange: vi.fn(),
  getPendingForCourt: vi.fn(),
  getForOrganization: vi.fn(),
  getReservationGroupDetail: vi.fn(),
  getPendingCount: vi.fn(),
};

vi.mock("@/lib/modules/reservation/factories/reservation.factory", () => ({
  makeReservationOwnerService: () => mockReservationOwnerService,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { reservationOwnerRouter } from "@/lib/modules/reservation/reservation-owner.router";

const createCaller = () =>
  reservationOwnerRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.ownerUserId,
      email: "owner@example.com",
      role: "member",
    },
    userId: TEST_IDS.ownerUserId,
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
  } as unknown as Parameters<typeof reservationOwnerRouter.createCaller>[0]);

const hoursFromNowIso = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("reservationOwnerRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acceptGroup valid payload -> calls acceptReservationGroup", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.acceptReservationGroup.mockResolvedValue([]);

    // Act
    await caller.acceptGroup({
      reservationGroupId: TEST_IDS.reservationGroupId,
    });

    // Assert
    expect(
      mockReservationOwnerService.acceptReservationGroup,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationGroupId: TEST_IDS.reservationGroupId,
    });
  });

  it("acceptGroup group not found -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.acceptReservationGroup.mockRejectedValue(
      new ReservationGroupNotFoundError(TEST_IDS.reservationGroupId),
    );

    // Act + Assert
    await expect(
      caller.acceptGroup({ reservationGroupId: TEST_IDS.reservationGroupId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("confirmPaymentGroup valid payload -> calls confirmPaymentGroup", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.confirmPaymentGroup.mockResolvedValue([]);

    // Act
    await caller.confirmPaymentGroup({
      reservationGroupId: TEST_IDS.reservationGroupId,
      notes: "All receipts validated",
    });

    // Assert
    expect(
      mockReservationOwnerService.confirmPaymentGroup,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationGroupId: TEST_IDS.reservationGroupId,
      notes: "All receipts validated",
    });
  });

  it("confirmPaidOffline valid payload -> calls confirmPaidOffline", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.confirmPaidOffline.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    // Act
    await caller.confirmPaidOffline({
      reservationId: TEST_IDS.reservationId,
      paymentMethodId: TEST_IDS.paymentMethodId,
      paymentReference: "REF-123",
    });

    // Assert
    expect(mockReservationOwnerService.confirmPaidOffline).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        paymentMethodId: TEST_IDS.paymentMethodId,
        paymentReference: "REF-123",
      },
    );
  });

  it("rejectGroup valid payload -> calls rejectReservationGroup", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.rejectReservationGroup.mockResolvedValue([]);

    // Act
    await caller.rejectGroup({
      reservationGroupId: TEST_IDS.reservationGroupId,
      reason: "Schedule conflict",
    });

    // Assert
    expect(
      mockReservationOwnerService.rejectReservationGroup,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationGroupId: TEST_IDS.reservationGroupId,
      reason: "Schedule conflict",
    });
  });

  it("createGuestBooking valid payload -> calls createGuestBooking", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      courtId: TEST_IDS.courtId,
      startTime: hoursFromNowIso(2),
      endTime: hoursFromNowIso(3),
      guestProfileId: TEST_IDS.guestProfileId,
      notes: "Walk-in confirmed",
    };
    mockReservationOwnerService.createGuestBooking.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    // Act
    await caller.createGuestBooking(input);

    // Assert
    expect(mockReservationOwnerService.createGuestBooking).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      input,
    );
  });

  it("createGuestBooking overlap error -> maps to CONFLICT", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.createGuestBooking.mockRejectedValue(
      new CourtBlockOverlapError({ courtId: TEST_IDS.courtId }),
    );

    // Act + Assert
    await expect(
      caller.createGuestBooking({
        courtId: TEST_IDS.courtId,
        startTime: hoursFromNowIso(2),
        endTime: hoursFromNowIso(3),
        guestProfileId: TEST_IDS.guestProfileId,
        notes: "Walk-in confirmed",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("convertWalkInBlockToGuest valid payload -> calls convertWalkInBlockToGuest", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      blockId: TEST_IDS.blockId,
      guestMode: "existing" as const,
      guestProfileId: TEST_IDS.guestProfileId,
      notes: "Converted from walk-in block",
    };
    mockReservationOwnerService.convertWalkInBlockToGuest.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    // Act
    await caller.convertWalkInBlockToGuest(input);

    // Assert
    expect(
      mockReservationOwnerService.convertWalkInBlockToGuest,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, input);
  });

  it("getActiveForCourtRange valid payload -> calls getActiveForCourtRange", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      courtId: TEST_IDS.courtId,
      startTime: hoursFromNowIso(1),
      endTime: hoursFromNowIso(4),
    };
    mockReservationOwnerService.getActiveForCourtRange.mockResolvedValue([]);

    // Act
    const result = await caller.getActiveForCourtRange(input);

    // Assert
    expect(result).toEqual([]);
    expect(
      mockReservationOwnerService.getActiveForCourtRange,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, input);
  });

  it("getPendingForCourt valid payload -> calls getPendingForCourt", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.getPendingForCourt.mockResolvedValue([]);

    // Act
    const result = await caller.getPendingForCourt({
      courtId: TEST_IDS.courtId,
    });

    // Assert
    expect(result).toEqual([]);
    expect(mockReservationOwnerService.getPendingForCourt).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.courtId,
    );
  });

  it("getForOrganization valid payload -> calls getForOrganization", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      organizationId: TEST_IDS.organizationId,
      status: "CREATED" as const,
      limit: 20,
      offset: 0,
    };
    mockReservationOwnerService.getForOrganization.mockResolvedValue([]);

    // Act
    const result = await caller.getForOrganization(input);

    // Assert
    expect(result).toEqual([]);
    expect(mockReservationOwnerService.getForOrganization).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      input,
    );
  });

  it("getGroupDetail valid payload -> calls getReservationGroupDetail", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.getReservationGroupDetail.mockResolvedValue({
      reservationGroupId: TEST_IDS.reservationGroupId,
      reservations: [],
    });

    // Act
    const result = await caller.getGroupDetail({
      reservationGroupId: TEST_IDS.reservationGroupId,
    });

    // Assert
    expect(result).toEqual({
      reservationGroupId: TEST_IDS.reservationGroupId,
      reservations: [],
    });
    expect(
      mockReservationOwnerService.getReservationGroupDetail,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationGroupId: TEST_IDS.reservationGroupId,
    });
  });

  it("getPendingCount valid payload -> calls getPendingCount", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.getPendingCount.mockResolvedValue(3);

    // Act
    const result = await caller.getPendingCount({
      organizationId: TEST_IDS.organizationId,
    });

    // Assert
    expect(result).toBe(3);
    expect(mockReservationOwnerService.getPendingCount).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.organizationId,
    );
  });

  it("accept legacy endpoint -> still calls acceptReservation", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.acceptReservation.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "AWAITING_PAYMENT",
    });

    // Act
    await caller.accept({ reservationId: TEST_IDS.reservationId });

    // Assert
    expect(mockReservationOwnerService.acceptReservation).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.reservationId,
    );
  });

  it("confirmPayment legacy endpoint -> still calls confirmPayment", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.confirmPayment.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    // Act
    await caller.confirmPayment({
      reservationId: TEST_IDS.reservationId,
      notes: "Receipt accepted",
    });

    // Assert
    expect(mockReservationOwnerService.confirmPayment).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        notes: "Receipt accepted",
      },
    );
  });

  it("reject legacy endpoint -> still calls rejectReservation", async () => {
    // Arrange
    const caller = createCaller();
    mockReservationOwnerService.rejectReservation.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CANCELLED",
    });

    // Act
    await caller.reject({
      reservationId: TEST_IDS.reservationId,
      reason: "Schedule conflict",
    });

    // Assert
    expect(mockReservationOwnerService.rejectReservation).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        reason: "Schedule conflict",
      },
    );
  });
});
