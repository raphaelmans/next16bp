import { describe, expect, it, vi } from "vitest";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import { InvalidCoachAvailabilityAddonSelectionError } from "@/lib/modules/coach-availability/errors/coach-availability.errors";
import { CoachAvailabilityService } from "@/lib/modules/coach-availability/services/coach-availability.service";
import type {
  CoachAddonRateRuleRecord,
  CoachAddonRecord,
  CoachBlockRecord,
  CoachHoursWindowRecord,
  CoachRateRuleRecord,
  CoachRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_ADDON_PRICING_V2: true,
  },
}));

type CoachAvailabilityServiceDeps = ConstructorParameters<
  typeof CoachAvailabilityService
>;

const TEST_IDS = {
  coachId: "11111111-1111-4111-8111-111111111111",
  reservationId: "22222222-2222-4222-8222-222222222222",
  blockId: "33333333-3333-4333-8333-333333333333",
  addonId: "44444444-4444-4444-8444-444444444444",
};

const now = new Date("2026-03-14T00:00:00.000Z");

const toCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: "55555555-5555-4555-8555-555555555555",
    profileId: "66666666-6666-4666-8666-666666666666",
    name: "Coach Alex",
    slug: "coach-alex",
    tagline: null,
    bio: null,
    introVideoUrl: null,
    yearsOfExperience: 5,
    playingBackground: null,
    coachingPhilosophy: null,
    city: "Cebu City",
    province: "Cebu",
    country: "PH",
    latitude: null,
    longitude: null,
    timeZone: "Asia/Manila",
    willingToTravel: false,
    onlineCoaching: false,
    baseHourlyRateCents: 1200,
    baseHourlyRateCurrency: "PHP",
    isActive: true,
    featuredRank: 0,
    provinceRank: 0,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachRecord;

const toHoursRecord = (
  value: Partial<CoachHoursWindowRecord>,
): CoachHoursWindowRecord =>
  ({
    id: `hours-${Math.random()}`,
    coachId: TEST_IDS.coachId,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 720,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachHoursWindowRecord;

const toRateRuleRecord = (
  value: Partial<CoachRateRuleRecord>,
): CoachRateRuleRecord =>
  ({
    id: `rule-${Math.random()}`,
    coachId: TEST_IDS.coachId,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 720,
    hourlyRateCents: 1500,
    currency: "PHP",
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachRateRuleRecord;

const toAddonRecord = (value: Partial<CoachAddonRecord>): CoachAddonRecord =>
  ({
    id: TEST_IDS.addonId,
    coachId: TEST_IDS.coachId,
    label: "Video review",
    isActive: true,
    mode: "OPTIONAL",
    pricingType: "FLAT",
    flatFeeCents: 300,
    flatFeeCurrency: "PHP",
    displayOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachAddonRecord;

const toAddonRateRuleRecord = (
  value: Partial<CoachAddonRateRuleRecord>,
): CoachAddonRateRuleRecord =>
  ({
    id: `addon-rule-${Math.random()}`,
    addonId: TEST_IDS.addonId,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 720,
    hourlyRateCents: 200,
    currency: "PHP",
    createdAt: now,
    ...value,
  }) as CoachAddonRateRuleRecord;

const toReservationRecord = (
  value: Partial<ReservationRecord>,
): ReservationRecord =>
  ({
    id: TEST_IDS.reservationId,
    courtId: null,
    coachId: TEST_IDS.coachId,
    startTime: new Date("2026-03-16T02:00:00.000Z"),
    endTime: new Date("2026-03-16T03:00:00.000Z"),
    totalPriceCents: 1500,
    currency: "PHP",
    playerId: "77777777-7777-4777-8777-777777777777",
    groupId: null,
    guestProfileId: null,
    playerNameSnapshot: null,
    playerEmailSnapshot: null,
    playerPhoneSnapshot: null,
    status: "CONFIRMED",
    expiresAt: null,
    termsAcceptedAt: null,
    confirmedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    pingOwnerCount: 0,
    updatedAt: now,
    ...value,
  }) as ReservationRecord;

const toBlockRecord = (value: Partial<CoachBlockRecord>): CoachBlockRecord =>
  ({
    id: TEST_IDS.blockId,
    coachId: TEST_IDS.coachId,
    startTime: new Date("2026-03-16T03:00:00.000Z"),
    endTime: new Date("2026-03-16T04:00:00.000Z"),
    reason: "Personal errand",
    blockType: "PERSONAL",
    createdAt: now,
    ...value,
  }) as CoachBlockRecord;

const createHarness = (options?: {
  coach?: CoachRecord | null;
  hours?: CoachHoursWindowRecord[];
  rules?: CoachRateRuleRecord[];
  addons?: CoachAddonRecord[];
  addonRules?: CoachAddonRateRuleRecord[];
  reservations?: ReservationRecord[];
  blocks?: CoachBlockRecord[];
}) => {
  const coachRepository = {
    findById: vi.fn(async () =>
      options && "coach" in options ? options.coach : toCoachRecord(),
    ),
  };
  const coachHoursRepository = {
    findByCoachId: vi.fn(async () => options?.hours ?? []),
  };
  const coachRateRuleRepository = {
    findByCoachId: vi.fn(async () => options?.rules ?? []),
  };
  const coachAddonRepository = {
    findActiveByCoachIds: vi.fn(async () => options?.addons ?? []),
    findRateRulesByAddonIds: vi.fn(async () => options?.addonRules ?? []),
  };
  const reservationRepository = {
    findOverlappingActiveByCoachIds: vi.fn(
      async () => options?.reservations ?? [],
    ),
  };
  const coachBlockRepository = {
    findOverlappingByCoachId: vi.fn(async () => options?.blocks ?? []),
  };

  const service = new CoachAvailabilityService(
    coachRepository as unknown as CoachAvailabilityServiceDeps[0],
    coachHoursRepository as unknown as CoachAvailabilityServiceDeps[1],
    coachRateRuleRepository as unknown as CoachAvailabilityServiceDeps[2],
    coachAddonRepository as unknown as CoachAvailabilityServiceDeps[3],
    reservationRepository as unknown as CoachAvailabilityServiceDeps[4],
    coachBlockRepository as unknown as CoachAvailabilityServiceDeps[5],
  );

  return {
    service,
    repositories: {
      coachRepository,
      coachHoursRepository,
      coachRateRuleRepository,
      coachAddonRepository,
      reservationRepository,
      coachBlockRepository,
    },
  };
};

describe("CoachAvailabilityService", () => {
  it("returns available and unavailable slots with reservation and block reasons", async () => {
    const harness = createHarness({
      hours: [toHoursRecord()],
      rules: [toRateRuleRecord()],
      reservations: [toReservationRecord()],
      blocks: [toBlockRecord()],
    });

    const result = await harness.service.getForCoach({
      coachId: TEST_IDS.coachId,
      date: "2026-03-16T00:00:00.000Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });

    expect(result.options).toHaveLength(3);
    expect(result.options).toEqual([
      expect.objectContaining({
        status: "AVAILABLE",
        unavailableReason: null,
        totalPriceCents: 1500,
      }),
      expect.objectContaining({
        status: "BOOKED",
        unavailableReason: "RESERVATION",
      }),
      expect.objectContaining({
        status: "BOOKED",
        unavailableReason: "BLOCK",
      }),
    ]);
    expect(result.diagnostics).toEqual({
      hasHoursWindows: true,
      hasRateRules: true,
      dayHasHours: true,
      allSlotsBooked: false,
    });
  });

  it("rejects selected add-ons that do not belong to the coach", async () => {
    const harness = createHarness({
      hours: [toHoursRecord()],
      rules: [toRateRuleRecord()],
      addons: [toAddonRecord({ id: TEST_IDS.addonId })],
      addonRules: [toAddonRateRuleRecord({ addonId: TEST_IDS.addonId })],
    });

    await expect(
      harness.service.getForCoach({
        coachId: TEST_IDS.coachId,
        date: "2026-03-16T00:00:00.000Z",
        durationMinutes: 60,
        selectedAddons: [
          {
            addonId: "99999999-9999-4999-8999-999999999999",
            quantity: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidCoachAvailabilityAddonSelectionError);
  });

  it("throws when the coach is inactive", async () => {
    const harness = createHarness({
      coach: toCoachRecord({ isActive: false }),
    });

    await expect(
      harness.service.getForCoach({
        coachId: TEST_IDS.coachId,
        date: "2026-03-16T00:00:00.000Z",
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(CoachNotActiveError);
  });

  it("extends single-day queries through contiguous overnight hours", async () => {
    const harness = createHarness({
      hours: [
        toHoursRecord({
          dayOfWeek: 0,
          startMinute: 1320,
          endMinute: 1440,
        }),
        toHoursRecord({
          dayOfWeek: 1,
          startMinute: 0,
          endMinute: 120,
        }),
      ],
      rules: [
        toRateRuleRecord({
          dayOfWeek: 0,
          startMinute: 1320,
          endMinute: 1440,
        }),
        toRateRuleRecord({
          dayOfWeek: 1,
          startMinute: 0,
          endMinute: 120,
        }),
      ],
    });

    const result = await harness.service.getForCoach({
      coachId: TEST_IDS.coachId,
      date: "2026-03-15T12:00:00.000Z",
      durationMinutes: 120,
    });

    expect(result.options).toEqual([
      expect.objectContaining({
        startTime: "2026-03-15T14:00:00.000Z",
        endTime: "2026-03-15T16:00:00.000Z",
      }),
      expect.objectContaining({
        startTime: "2026-03-15T15:00:00.000Z",
        endTime: "2026-03-15T17:00:00.000Z",
      }),
      expect.objectContaining({
        startTime: "2026-03-15T16:00:00.000Z",
        endTime: "2026-03-15T18:00:00.000Z",
      }),
    ]);
  });

  it("throws when the coach does not exist", async () => {
    const harness = createHarness({ coach: null });

    await expect(
      harness.service.getForCoach({
        coachId: TEST_IDS.coachId,
        date: "2026-03-16T00:00:00.000Z",
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(CoachNotFoundError);
  });
});
