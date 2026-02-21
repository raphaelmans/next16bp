import { describe, expect, it, vi } from "vitest";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { SetCourtAddonsDTO } from "@/lib/modules/court-addon/dtos";
import {
  CourtAddonCurrencyMismatchError,
  CourtAddonOverlapError,
  CourtAddonValidationError,
} from "@/lib/modules/court-addon/errors/court-addon.errors";
import type { ICourtAddonRepository } from "@/lib/modules/court-addon/repositories/court-addon.repository";
import { CourtAddonService } from "@/lib/modules/court-addon/services/court-addon.service";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
  CourtRateRuleRecord,
} from "@/lib/shared/infra/db/schema";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";

const COURT_ID = "11111111-1111-1111-1111-111111111111";
const PLACE_ID = "22222222-2222-2222-2222-222222222222";
const ORG_ID = "33333333-3333-3333-3333-333333333333";
const OWNER_USER_ID = "44444444-4444-4444-4444-444444444444";
const now = new Date("2026-01-05T00:00:00.000Z");

type AddonInput = SetCourtAddonsDTO["addons"][number];

const createHourlyAddon = (
  overrides?: Partial<AddonInput>,
  rules?: AddonInput["rules"],
): AddonInput => ({
  label: "Lights",
  mode: "OPTIONAL",
  pricingType: "HOURLY",
  rules: rules ?? [
    {
      dayOfWeek: 1,
      startMinute: 540,
      endMinute: 600,
      hourlyRateCents: 200,
      currency: "PHP",
    },
  ],
  ...overrides,
});

const createFlatAddon = (
  overrides?: Partial<AddonInput>,
  rules?: AddonInput["rules"],
): AddonInput => ({
  label: "Locker",
  mode: "AUTO",
  pricingType: "FLAT",
  flatFeeCents: 500,
  flatFeeCurrency: "PHP",
  rules: rules ?? [
    {
      dayOfWeek: 1,
      startMinute: 540,
      endMinute: 600,
    },
  ],
  ...overrides,
});

const createPayload = (addons: AddonInput[]): SetCourtAddonsDTO => ({
  courtId: COURT_ID,
  addons,
});

const createRateRuleRecord = (
  overrides?: Partial<CourtRateRuleRecord>,
): CourtRateRuleRecord =>
  ({
    id: "55555555-5555-5555-5555-555555555555",
    courtId: COURT_ID,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 660,
    hourlyRateCents: 1000,
    currency: "PHP",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }) as CourtRateRuleRecord;

const createCourtAddonRecord = (
  id: string,
  data: {
    courtId: string;
    label: string;
    isActive: boolean;
    mode: CourtAddonRecord["mode"];
    pricingType: CourtAddonRecord["pricingType"];
    flatFeeCents: number | null;
    flatFeeCurrency: string | null;
    displayOrder: number;
  },
): CourtAddonRecord => ({
  id,
  courtId: data.courtId,
  label: data.label,
  isActive: data.isActive,
  mode: data.mode,
  pricingType: data.pricingType,
  flatFeeCents: data.flatFeeCents,
  flatFeeCurrency: data.flatFeeCurrency,
  displayOrder: data.displayOrder,
  createdAt: now,
  updatedAt: now,
});

const createCourtAddonRateRuleRecord = (
  id: string,
  data: {
    addonId: string;
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    hourlyRateCents: number | null;
    currency: string | null;
  },
): CourtAddonRateRuleRecord => ({
  id,
  addonId: data.addonId,
  dayOfWeek: data.dayOfWeek,
  startMinute: data.startMinute,
  endMinute: data.endMinute,
  hourlyRateCents: data.hourlyRateCents,
  currency: data.currency,
  createdAt: now,
  updatedAt: now,
});

const createHarness = (
  baseRules: CourtRateRuleRecord[] = [createRateRuleRecord()],
) => {
  const txMarker = { id: "tx-unit-test" };
  let addonCount = 0;
  let ruleCount = 0;

  const courtAddonRepositoryFns = {
    findByCourtId: vi.fn(async () => []),
    findByCourtIds: vi.fn(async () => []),
    findActiveByCourtIds: vi.fn(async () => []),
    findRateRulesByAddonIds: vi.fn(async () => []),
    deleteByCourtId: vi.fn(async () => undefined),
    createOne: vi.fn(async (data) => {
      addonCount += 1;
      return createCourtAddonRecord(`addon-${addonCount}`, {
        courtId: data.courtId,
        label: data.label,
        isActive: data.isActive,
        mode: data.mode,
        pricingType: data.pricingType,
        flatFeeCents: data.flatFeeCents,
        flatFeeCurrency: data.flatFeeCurrency,
        displayOrder: data.displayOrder,
      });
    }),
    createManyRateRules: vi.fn(async (rows) =>
      rows.map((row) => {
        ruleCount += 1;
        return createCourtAddonRateRuleRecord(`rule-${ruleCount}`, {
          addonId: row.addonId,
          dayOfWeek: row.dayOfWeek,
          startMinute: row.startMinute,
          endMinute: row.endMinute,
          hourlyRateCents: row.hourlyRateCents,
          currency: row.currency,
        });
      }),
    ),
  };

  const courtRepositoryFns = {
    findById: vi.fn(async () => ({ id: COURT_ID, placeId: PLACE_ID })),
  };

  const placeRepositoryFns = {
    findById: vi.fn(async () => ({ id: PLACE_ID, organizationId: ORG_ID })),
  };

  const organizationRepositoryFns = {
    findById: vi.fn(async () => ({ id: ORG_ID, ownerUserId: OWNER_USER_ID })),
  };

  const courtRateRuleRepositoryFns = {
    findByCourtId: vi.fn(async () => baseRules),
  };

  const run = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(txMarker),
  );

  const service = new CourtAddonService(
    courtAddonRepositoryFns as unknown as ICourtAddonRepository,
    courtRateRuleRepositoryFns as unknown as ICourtRateRuleRepository,
    courtRepositoryFns as unknown as ICourtRepository,
    placeRepositoryFns as unknown as IPlaceRepository,
    organizationRepositoryFns as unknown as IOrganizationRepository,
    { run } as unknown as TransactionManager,
  );

  return {
    service,
    txMarker,
    run,
    courtAddonRepositoryFns,
    courtRateRuleRepositoryFns,
    courtRepositoryFns,
    placeRepositoryFns,
    organizationRepositoryFns,
  };
};

describe("CourtAddonService", () => {
  describe("setForCourt", () => {
    it("valid payload -> persists addons using shared transaction context", async () => {
      // Arrange
      const harness = createHarness();
      const payload = createPayload([createHourlyAddon()]);

      // Act
      const result = await harness.service.setForCourt(OWNER_USER_ID, payload);

      // Assert
      expect(harness.run).toHaveBeenCalledTimes(1);
      expect(harness.courtRepositoryFns.findById).toHaveBeenCalledWith(
        COURT_ID,
        { tx: harness.txMarker },
      );
      expect(harness.placeRepositoryFns.findById).toHaveBeenCalledWith(
        PLACE_ID,
        { tx: harness.txMarker },
      );
      expect(harness.organizationRepositoryFns.findById).toHaveBeenCalledWith(
        ORG_ID,
        { tx: harness.txMarker },
      );
      expect(
        harness.courtRateRuleRepositoryFns.findByCourtId,
      ).toHaveBeenCalledWith(COURT_ID, { tx: harness.txMarker });
      expect(
        harness.courtAddonRepositoryFns.deleteByCourtId,
      ).toHaveBeenCalledWith(COURT_ID, { tx: harness.txMarker });
      expect(harness.courtAddonRepositoryFns.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          courtId: COURT_ID,
          label: "Lights",
          pricingType: "HOURLY",
        }),
        { tx: harness.txMarker },
      );
      expect(
        harness.courtAddonRepositoryFns.createManyRateRules,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 200,
            currency: "PHP",
          }),
        ]),
        { tx: harness.txMarker },
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.rules).toHaveLength(1);
    });

    it("HOURLY addon without rules -> throws validation error", async () => {
      // Arrange
      const harness = createHarness();
      const payload = createPayload([createHourlyAddon({}, [])]);

      // Act / Assert
      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonValidationError);
    });

    it("FLAT addon missing fee fields -> throws validation error", async () => {
      // Arrange
      const harness = createHarness();
      const payload = createPayload([
        createFlatAddon({
          flatFeeCents: undefined,
          flatFeeCurrency: undefined,
        }),
      ]);

      // Act / Assert
      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonValidationError);
    });

    it("overlapping addon rules on same day -> throws overlap error", async () => {
      // Arrange
      const harness = createHarness();
      const payload = createPayload([
        createHourlyAddon({}, [
          {
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 200,
            currency: "PHP",
          },
          {
            dayOfWeek: 1,
            startMinute: 570,
            endMinute: 630,
            hourlyRateCents: 200,
            currency: "PHP",
          },
        ]),
      ]);

      // Act / Assert
      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonOverlapError);
    });

    it("addon currency that differs from base rules -> throws currency mismatch", async () => {
      // Arrange
      const harness = createHarness([
        createRateRuleRecord({ currency: "PHP" }),
      ]);
      const payload = createPayload([
        createHourlyAddon({}, [
          {
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 200,
            currency: "USD",
          },
        ]),
      ]);

      // Act / Assert
      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonCurrencyMismatchError);
    });
  });
});
