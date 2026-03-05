import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { SetCourtAddonsDTO } from "@/lib/modules/court-addon/dtos";
import {
  CourtAddonOverlapError,
  CourtAddonValidationError,
} from "@/lib/modules/court-addon/errors/court-addon.errors";
import type { ICourtAddonRepository } from "@/lib/modules/court-addon/repositories/court-addon.repository";
import { CourtAddonService } from "@/lib/modules/court-addon/services/court-addon.service";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
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
  rules: rules ?? [],
  ...overrides,
});

const createPayload = (addons: AddonInput[]): SetCourtAddonsDTO => ({
  courtId: COURT_ID,
  addons,
});

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

const createHarness = (options?: {
  courtExists?: boolean;
  ownerUserId?: string;
  placeHasOrganization?: boolean;
}) => {
  const txMarker = { id: "tx-court-addon-test" };
  let addonCount = 0;
  let ruleCount = 0;

  const courtExists = options?.courtExists ?? true;
  const ownerUserId = options?.ownerUserId ?? OWNER_USER_ID;
  const placeHasOrganization = options?.placeHasOrganization ?? true;

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
    findById: vi.fn(async () =>
      courtExists ? { id: COURT_ID, placeId: PLACE_ID } : null,
    ),
  };

  const placeRepositoryFns = {
    findById: vi.fn(async () => ({
      id: PLACE_ID,
      organizationId: placeHasOrganization ? ORG_ID : null,
    })),
  };

  const organizationMemberServiceFns = {
    assertOrganizationPermission: vi.fn(async (userId: string) => {
      if (userId !== ownerUserId) {
        throw new OrganizationMemberPermissionDeniedError("place.manage", {
          organizationId: ORG_ID,
          userId,
        });
      }
    }),
  };

  const run = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(txMarker),
  );

  const service = new CourtAddonService(
    courtAddonRepositoryFns as unknown as ICourtAddonRepository,
    courtRepositoryFns as unknown as ICourtRepository,
    placeRepositoryFns as unknown as IPlaceRepository,
    organizationMemberServiceFns as unknown as IOrganizationMemberService,
    { run } as unknown as TransactionManager,
  );

  return {
    service,
    txMarker,
    run,
    courtAddonRepositoryFns,
    courtRepositoryFns,
    placeRepositoryFns,
    organizationMemberServiceFns,
  };
};

describe("CourtAddonService", () => {
  describe("setForCourt", () => {
    it("valid payload -> persists addons using shared transaction context", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createHourlyAddon(),
        createFlatAddon({ mode: "OPTIONAL" }),
      ]);

      const result = await harness.service.setForCourt(OWNER_USER_ID, payload);

      expect(harness.run).toHaveBeenCalledTimes(1);
      expect(harness.courtRepositoryFns.findById).toHaveBeenCalledWith(
        COURT_ID,
        { tx: harness.txMarker },
      );
      expect(harness.placeRepositoryFns.findById).toHaveBeenCalledWith(
        PLACE_ID,
        { tx: harness.txMarker },
      );
      expect(
        harness.organizationMemberServiceFns.assertOrganizationPermission,
      ).toHaveBeenCalledWith(OWNER_USER_ID, ORG_ID, "place.manage", {
        tx: harness.txMarker,
      });
      expect(
        harness.courtAddonRepositoryFns.deleteByCourtId,
      ).toHaveBeenCalledWith(COURT_ID, { tx: harness.txMarker });
      expect(harness.courtAddonRepositoryFns.createOne).toHaveBeenCalledTimes(
        2,
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
            currency: DEFAULT_CURRENCY,
          }),
        ]),
        { tx: harness.txMarker },
      );
      expect(result).toHaveLength(2);
      expect(result[1]?.addon.flatFeeCurrency).toBe(DEFAULT_CURRENCY);
    });

    it("HOURLY addon without rules -> throws validation error", async () => {
      const harness = createHarness();
      const payload = createPayload([createHourlyAddon({}, [])]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonValidationError);
    });

    it("FLAT addon missing fee fields -> throws validation error", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createFlatAddon({ flatFeeCents: undefined }),
      ]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonValidationError);
    });

    it("FLAT addon rule with hourly pricing fields -> throws validation error", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createFlatAddon({}, [
          {
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 100,
          },
        ]),
      ]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonValidationError);
    });

    it("overlapping addon rules on same day -> throws overlap error", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createHourlyAddon({}, [
          {
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 200,
          },
          {
            dayOfWeek: 1,
            startMinute: 570,
            endMinute: 630,
            hourlyRateCents: 200,
          },
        ]),
      ]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtAddonOverlapError);
    });

    it("non-owner user -> throws OrganizationMemberPermissionDeniedError", async () => {
      const harness = createHarness({ ownerUserId: "someone-else" });
      const payload = createPayload([createHourlyAddon()]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(OrganizationMemberPermissionDeniedError);
    });

    it("missing court -> throws CourtNotFoundError", async () => {
      const harness = createHarness({ courtExists: false });
      const payload = createPayload([createHourlyAddon()]);

      await expect(
        harness.service.setForCourt(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(CourtNotFoundError);
    });
  });
});
