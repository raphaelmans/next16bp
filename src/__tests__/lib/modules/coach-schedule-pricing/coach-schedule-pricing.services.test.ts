import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import {
  CoachAddonOverlapError,
  CoachAddonValidationError,
} from "@/lib/modules/coach-addon/errors/coach-addon.errors";
import { CoachAddonService } from "@/lib/modules/coach-addon/services/coach-addon.service";
import {
  CoachBlockNotFoundError,
  CoachBlockOverlapError,
} from "@/lib/modules/coach-block/errors/coach-block.errors";
import { CoachBlockService } from "@/lib/modules/coach-block/services/coach-block.service";
import { CoachHoursOverlapError } from "@/lib/modules/coach-hours/errors/coach-hours.errors";
import { CoachHoursService } from "@/lib/modules/coach-hours/services/coach-hours.service";
import { CoachRateRuleOverlapError } from "@/lib/modules/coach-rate-rule/errors/coach-rate-rule.errors";
import { CoachRateRuleService } from "@/lib/modules/coach-rate-rule/services/coach-rate-rule.service";
import type {
  CoachAddonRateRuleRecord,
  CoachAddonRecord,
  CoachBlockRecord,
  CoachHoursWindowRecord,
  CoachRateRuleRecord,
  CoachRecord,
} from "@/lib/shared/infra/db/schema";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  otherCoachId: "33333333-3333-4333-8333-333333333333",
  blockId: "44444444-4444-4444-8444-444444444444",
};

const now = new Date("2026-03-14T00:00:00.000Z");

const createCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: TEST_IDS.userId,
    profileId: "55555555-5555-4555-8555-555555555555",
    name: "Coach Alex",
    slug: "coach-alex",
    tagline: "Tagline",
    bio: "Bio",
    introVideoUrl: null,
    yearsOfExperience: 3,
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
    verificationStatus: "UNVERIFIED",
    verificationSubmittedAt: null,
    verifiedAt: null,
    isActive: true,
    featuredRank: 0,
    provinceRank: 0,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachRecord;

const createHarness = () => {
  const txMarker = { txId: "coach-schedule-pricing-tx" };
  const run = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(txMarker),
  );

  const coachRepository = {
    findByUserId: vi.fn(async () => createCoachRecord()),
  };

  return {
    txMarker,
    run,
    coachRepository,
  };
};

describe("Coach schedule/pricing services", () => {
  it("CoachHoursService.setHours stores windows in a transaction", async () => {
    const base = createHarness();
    const coachHoursRepository = {
      findByCoachId: vi.fn(async () => []),
      deleteByCoachId: vi.fn(async () => undefined),
      createMany: vi.fn(async (rows) =>
        rows.map(
          (row, index) =>
            ({
              id: `hours-${index + 1}`,
              ...row,
              createdAt: now,
              updatedAt: now,
            }) satisfies CoachHoursWindowRecord,
        ),
      ),
    };
    const service = new CoachHoursService(
      coachHoursRepository,
      base.coachRepository,
      { run: base.run },
    );

    const result = await service.setHours(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      windows: [{ dayOfWeek: 1, startMinute: 540, endMinute: 660 }],
    });

    expect(base.run).toHaveBeenCalledTimes(1);
    expect(base.coachRepository.findByUserId).toHaveBeenCalledWith(
      TEST_IDS.userId,
      { tx: base.txMarker },
    );
    expect(coachHoursRepository.deleteByCoachId).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      { tx: base.txMarker },
    );
    expect(coachHoursRepository.createMany).toHaveBeenCalledWith(
      [
        {
          coachId: TEST_IDS.coachId,
          dayOfWeek: 1,
          startMinute: 540,
          endMinute: 660,
          isAvailable: true,
        },
      ],
      { tx: base.txMarker },
    );
    expect(result).toHaveLength(1);
  });

  it("CoachHoursService.setHours rejects overlapping windows", async () => {
    const base = createHarness();
    const service = new CoachHoursService(
      {
        findByCoachId: vi.fn(async () => []),
        deleteByCoachId: vi.fn(async () => undefined),
        createMany: vi.fn(async () => []),
      },
      base.coachRepository,
      { run: base.run },
    );

    await expect(
      service.setHours(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        windows: [
          { dayOfWeek: 1, startMinute: 540, endMinute: 660 },
          { dayOfWeek: 1, startMinute: 600, endMinute: 720 },
        ],
      }),
    ).rejects.toBeInstanceOf(CoachHoursOverlapError);
  });

  it("CoachRateRuleService.setRules applies the default currency", async () => {
    const base = createHarness();
    const coachRateRuleRepository = {
      findByCoachId: vi.fn(async () => []),
      findMatchingRule: vi.fn(async () => null),
      deleteByCoachId: vi.fn(async () => undefined),
      createMany: vi.fn(async (rows) =>
        rows.map(
          (row, index) =>
            ({
              id: `rule-${index + 1}`,
              ...row,
              createdAt: now,
              updatedAt: now,
            }) satisfies CoachRateRuleRecord,
        ),
      ),
    };
    const service = new CoachRateRuleService(
      coachRateRuleRepository,
      base.coachRepository,
      { run: base.run },
    );

    const result = await service.setRules(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      rules: [
        {
          dayOfWeek: 2,
          startMinute: 480,
          endMinute: 600,
          hourlyRateCents: 1500,
        },
      ],
    });

    expect(coachRateRuleRepository.createMany).toHaveBeenCalledWith(
      [
        {
          coachId: TEST_IDS.coachId,
          dayOfWeek: 2,
          startMinute: 480,
          endMinute: 600,
          hourlyRateCents: 1500,
          currency: DEFAULT_CURRENCY,
        },
      ],
      { tx: base.txMarker },
    );
    expect(result[0]?.currency).toBe(DEFAULT_CURRENCY);
  });

  it("CoachRateRuleService.setRules rejects overlapping rules", async () => {
    const base = createHarness();
    const service = new CoachRateRuleService(
      {
        findByCoachId: vi.fn(async () => []),
        findMatchingRule: vi.fn(async () => null),
        deleteByCoachId: vi.fn(async () => undefined),
        createMany: vi.fn(async () => []),
      },
      base.coachRepository,
      { run: base.run },
    );

    await expect(
      service.setRules(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        rules: [
          {
            dayOfWeek: 3,
            startMinute: 540,
            endMinute: 660,
            hourlyRateCents: 1500,
          },
          {
            dayOfWeek: 3,
            startMinute: 600,
            endMinute: 720,
            hourlyRateCents: 1800,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CoachRateRuleOverlapError);
  });

  it("CoachAddonService.setForCoach stores hourly and flat addons", async () => {
    const base = createHarness();
    let addonIndex = 0;
    let ruleIndex = 0;
    const coachAddonRepository = {
      findByCoachId: vi.fn(async () => []),
      findActiveByCoachIds: vi.fn(async () => []),
      findRateRulesByAddonIds: vi.fn(async () => []),
      deleteByCoachId: vi.fn(async () => undefined),
      createOne: vi.fn(async (row) => {
        addonIndex += 1;
        return {
          id: `addon-${addonIndex}`,
          ...row,
          createdAt: now,
          updatedAt: now,
        } satisfies CoachAddonRecord;
      }),
      createManyRateRules: vi.fn(async (rows) =>
        rows.map((row) => {
          ruleIndex += 1;
          return {
            id: `addon-rule-${ruleIndex}`,
            ...row,
            createdAt: now,
          } satisfies CoachAddonRateRuleRecord;
        }),
      ),
    };
    const service = new CoachAddonService(
      coachAddonRepository,
      base.coachRepository,
      { run: base.run },
    );

    const result = await service.setForCoach(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      addons: [
        {
          label: "Video review",
          mode: "OPTIONAL",
          pricingType: "HOURLY",
          rules: [
            {
              dayOfWeek: 1,
              startMinute: 540,
              endMinute: 600,
              hourlyRateCents: 400,
            },
          ],
        },
        {
          label: "Balls",
          mode: "AUTO",
          pricingType: "FLAT",
          flatFeeCents: 250,
          rules: [],
        },
      ],
    });

    expect(coachAddonRepository.deleteByCoachId).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      { tx: base.txMarker },
    );
    expect(coachAddonRepository.createOne).toHaveBeenCalledTimes(2);
    expect(coachAddonRepository.createManyRateRules).toHaveBeenCalledWith(
      [
        {
          addonId: "addon-1",
          dayOfWeek: 1,
          startMinute: 540,
          endMinute: 600,
          hourlyRateCents: 400,
          currency: DEFAULT_CURRENCY,
        },
      ],
      { tx: base.txMarker },
    );
    expect(result[0]?.addon.coachId).toBe(TEST_IDS.coachId);
    expect(result[1]?.addon.flatFeeCurrency).toBe(DEFAULT_CURRENCY);
  });

  it("CoachAddonService.setForCoach rejects invalid flat addon rules", async () => {
    const base = createHarness();
    const service = new CoachAddonService(
      {
        findByCoachId: vi.fn(async () => []),
        findActiveByCoachIds: vi.fn(async () => []),
        findRateRulesByAddonIds: vi.fn(async () => []),
        deleteByCoachId: vi.fn(async () => undefined),
        createOne: vi.fn(),
        createManyRateRules: vi.fn(),
      },
      base.coachRepository,
      { run: base.run },
    );

    await expect(
      service.setForCoach(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        addons: [
          {
            label: "Balls",
            mode: "AUTO",
            pricingType: "FLAT",
            flatFeeCents: 250,
            rules: [
              {
                dayOfWeek: 1,
                startMinute: 540,
                endMinute: 600,
                hourlyRateCents: 100,
              },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CoachAddonValidationError);
  });

  it("CoachAddonService.setForCoach rejects overlapping addon rules", async () => {
    const base = createHarness();
    const service = new CoachAddonService(
      {
        findByCoachId: vi.fn(async () => []),
        findActiveByCoachIds: vi.fn(async () => []),
        findRateRulesByAddonIds: vi.fn(async () => []),
        deleteByCoachId: vi.fn(async () => undefined),
        createOne: vi.fn(),
        createManyRateRules: vi.fn(),
      },
      base.coachRepository,
      { run: base.run },
    );

    await expect(
      service.setForCoach(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        addons: [
          {
            label: "Video review",
            mode: "OPTIONAL",
            pricingType: "HOURLY",
            rules: [
              {
                dayOfWeek: 1,
                startMinute: 540,
                endMinute: 600,
                hourlyRateCents: 200,
              },
              {
                dayOfWeek: 1,
                startMinute: 590,
                endMinute: 650,
                hourlyRateCents: 250,
              },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CoachAddonOverlapError);
  });

  it("CoachBlockService.create stores a coach block and rejects overlaps", async () => {
    const base = createHarness();
    const createdBlock = {
      id: TEST_IDS.blockId,
      coachId: TEST_IDS.coachId,
      startTime: new Date("2026-03-16T01:00:00.000Z"),
      endTime: new Date("2026-03-16T02:00:00.000Z"),
      reason: "Tournament",
      blockType: "PERSONAL",
      createdAt: now,
    } satisfies CoachBlockRecord;
    const coachBlockRepository = {
      findOverlappingByCoachId: vi.fn(async () => []),
      findByCoachIdInRange: vi.fn(async () => []),
      findById: vi.fn(async () => null),
      create: vi.fn(async () => createdBlock),
      deleteById: vi.fn(async () => undefined),
    };
    const service = new CoachBlockService(
      coachBlockRepository,
      base.coachRepository,
      { run: base.run },
    );

    const result = await service.create(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      startTime: "2026-03-16T01:00:00.000Z",
      endTime: "2026-03-16T02:00:00.000Z",
      reason: "Tournament",
    });

    expect(coachBlockRepository.findOverlappingByCoachId).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      new Date("2026-03-16T01:00:00.000Z"),
      new Date("2026-03-16T02:00:00.000Z"),
      { tx: base.txMarker },
    );
    expect(coachBlockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: TEST_IDS.coachId,
        blockType: "PERSONAL",
      }),
      { tx: base.txMarker },
    );
    expect(result.id).toBe(TEST_IDS.blockId);

    coachBlockRepository.findOverlappingByCoachId.mockResolvedValueOnce([
      { ...createdBlock, id: "existing-block" },
    ]);

    await expect(
      service.create(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        startTime: "2026-03-16T01:30:00.000Z",
        endTime: "2026-03-16T02:30:00.000Z",
      }),
    ).rejects.toBeInstanceOf(CoachBlockOverlapError);
  });

  it("CoachBlockService.delete rejects blocks from another coach", async () => {
    const base = createHarness();
    const service = new CoachBlockService(
      {
        findOverlappingByCoachId: vi.fn(async () => []),
        findByCoachIdInRange: vi.fn(async () => []),
        findById: vi.fn(async () => ({
          id: TEST_IDS.blockId,
          coachId: TEST_IDS.otherCoachId,
          startTime: now,
          endTime: new Date(now.getTime() + 60_000),
          reason: null,
          blockType: "OTHER",
          createdAt: now,
        })),
        create: vi.fn(),
        deleteById: vi.fn(async () => undefined),
      },
      base.coachRepository,
      { run: base.run },
    );

    await expect(
      service.delete(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        blockId: TEST_IDS.blockId,
      }),
    ).rejects.toBeInstanceOf(CoachBlockNotFoundError);
  });
});
