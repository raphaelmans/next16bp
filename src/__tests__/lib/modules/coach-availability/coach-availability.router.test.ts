import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import {
  coachAvailabilityRouter,
  handleCoachAvailabilityError,
} from "@/lib/modules/coach-availability/coach-availability.router";
import { InvalidCoachAvailabilityAddonSelectionError } from "@/lib/modules/coach-availability/errors/coach-availability.errors";

const TEST_IDS = {
  coachId: "11111111-1111-4111-8111-111111111111",
};

const mockCoachAvailabilityService = {
  getForCoach: vi.fn(),
  getForCoachRange: vi.fn(),
};

vi.mock(
  "@/lib/modules/coach-availability/factories/coach-availability.factory",
  () => ({
    makeCoachAvailabilityService: () => mockCoachAvailabilityService,
  }),
);

const createContext = () =>
  ({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: null,
    userId: null,
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
  }) as Parameters<typeof coachAvailabilityRouter.createCaller>[0];

describe("coachAvailabilityRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the coach availability payload from the service", async () => {
    const caller = coachAvailabilityRouter.createCaller(createContext());
    mockCoachAvailabilityService.getForCoach.mockResolvedValue({
      options: [
        {
          startTime: "2026-03-16T01:00:00.000Z",
          endTime: "2026-03-16T02:00:00.000Z",
          totalPriceCents: 1500,
          currency: "PHP",
          coachId: TEST_IDS.coachId,
          coachName: "Coach Alex",
          status: "AVAILABLE",
          unavailableReason: null,
          pricingWarnings: [],
          pricingBreakdown: {
            basePriceCents: 1500,
            addonPriceCents: 0,
            totalPriceCents: 1500,
            addons: [],
          },
        },
      ],
      diagnostics: {
        hasHoursWindows: true,
        hasRateRules: true,
        dayHasHours: true,
        allSlotsBooked: false,
      },
    });

    const result = await caller.getForCoach({
      coachId: TEST_IDS.coachId,
      date: "2026-03-16T00:00:00.000Z",
      durationMinutes: 60,
    });

    expect(result.options).toHaveLength(1);
    expect(mockCoachAvailabilityService.getForCoach).toHaveBeenCalledWith({
      coachId: TEST_IDS.coachId,
      date: "2026-03-16T00:00:00.000Z",
      durationMinutes: 60,
    });
  });

  it("passes range requests to the service", async () => {
    const caller = coachAvailabilityRouter.createCaller(createContext());
    mockCoachAvailabilityService.getForCoachRange.mockResolvedValue({
      options: [],
      diagnostics: {
        hasHoursWindows: true,
        hasRateRules: true,
        dayHasHours: true,
        allSlotsBooked: false,
      },
    });

    await caller.getForCoachRange({
      coachId: TEST_IDS.coachId,
      startDate: "2026-03-16T00:00:00.000Z",
      endDate: "2026-03-17T00:00:00.000Z",
      durationMinutes: 60,
    });

    expect(mockCoachAvailabilityService.getForCoachRange).toHaveBeenCalledWith({
      coachId: TEST_IDS.coachId,
      startDate: "2026-03-16T00:00:00.000Z",
      endDate: "2026-03-17T00:00:00.000Z",
      durationMinutes: 60,
    });
  });

  it("maps missing coaches to NOT_FOUND", () => {
    expect(() =>
      handleCoachAvailabilityError(new CoachNotFoundError(TEST_IDS.coachId)),
    ).toThrowError(
      expect.objectContaining({
        code: "NOT_FOUND",
      }),
    );
  });

  it("maps inactive coaches to NOT_FOUND", () => {
    expect(() =>
      handleCoachAvailabilityError(new CoachNotActiveError(TEST_IDS.coachId)),
    ).toThrowError(
      expect.objectContaining({
        code: "NOT_FOUND",
      }),
    );
  });

  it("maps invalid addon selections to BAD_REQUEST", () => {
    expect(() =>
      handleCoachAvailabilityError(
        new InvalidCoachAvailabilityAddonSelectionError({
          coachId: TEST_IDS.coachId,
          invalidAddonIds: ["addon-1"],
        }),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "BAD_REQUEST",
      }),
    );
  });

  it("rethrows unknown errors", () => {
    expect(() =>
      handleCoachAvailabilityError(new Error("unexpected")),
    ).toThrowError(
      expect.objectContaining({
        message: "unexpected",
      }),
    );
  });
});
