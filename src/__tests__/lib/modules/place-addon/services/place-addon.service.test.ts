import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { SetPlaceAddonsDTO } from "@/lib/modules/place-addon/dtos";
import {
  PlaceAddonOverlapError,
  PlaceAddonValidationError,
} from "@/lib/modules/place-addon/errors/place-addon.errors";
import type { IPlaceAddonRepository } from "@/lib/modules/place-addon/repositories/place-addon.repository";
import { PlaceAddonService } from "@/lib/modules/place-addon/services/place-addon.service";
import type {
  PlaceAddonRateRuleRecord,
  PlaceAddonRecord,
} from "@/lib/shared/infra/db/schema";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";

const PLACE_ID = "11111111-1111-1111-1111-111111111111";
const ORG_ID = "22222222-2222-2222-2222-222222222222";
const OWNER_USER_ID = "33333333-3333-3333-3333-333333333333";
const now = new Date("2026-02-01T00:00:00.000Z");

type PlaceAddonInput = SetPlaceAddonsDTO["addons"][number];

const createHourlyAddon = (
  overrides?: Partial<PlaceAddonInput>,
  rules?: PlaceAddonInput["rules"],
): PlaceAddonInput => ({
  label: "Lighting",
  mode: "OPTIONAL",
  pricingType: "HOURLY",
  rules: rules ?? [
    {
      dayOfWeek: 1,
      startMinute: 540,
      endMinute: 600,
      hourlyRateCents: 250,
    },
  ],
  ...overrides,
});

const createFlatAddon = (
  overrides?: Partial<PlaceAddonInput>,
  rules?: PlaceAddonInput["rules"],
): PlaceAddonInput => ({
  label: "Paddle Rental",
  mode: "OPTIONAL",
  pricingType: "FLAT",
  flatFeeCents: 500,
  rules: rules ?? [],
  ...overrides,
});

const createPayload = (addons: PlaceAddonInput[]): SetPlaceAddonsDTO => ({
  placeId: PLACE_ID,
  addons,
});

const createPlaceAddonRecord = (
  id: string,
  input: {
    placeId: string;
    label: string;
    isActive: boolean;
    mode: PlaceAddonRecord["mode"];
    pricingType: PlaceAddonRecord["pricingType"];
    flatFeeCents: number | null;
    flatFeeCurrency: string | null;
    displayOrder: number;
  },
): PlaceAddonRecord => ({
  id,
  placeId: input.placeId,
  label: input.label,
  isActive: input.isActive,
  mode: input.mode,
  pricingType: input.pricingType,
  flatFeeCents: input.flatFeeCents,
  flatFeeCurrency: input.flatFeeCurrency,
  displayOrder: input.displayOrder,
  createdAt: now,
  updatedAt: now,
});

const createPlaceAddonRateRuleRecord = (
  id: string,
  input: {
    addonId: string;
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    hourlyRateCents: number | null;
    currency: string | null;
  },
): PlaceAddonRateRuleRecord => ({
  id,
  addonId: input.addonId,
  dayOfWeek: input.dayOfWeek,
  startMinute: input.startMinute,
  endMinute: input.endMinute,
  hourlyRateCents: input.hourlyRateCents,
  currency: input.currency,
});

const createHarness = (options?: {
  placeExists?: boolean;
  ownerUserId?: string;
}) => {
  const txMarker = { id: "tx-place-addon-test" };
  let addonCount = 0;
  let ruleCount = 0;
  const placeExists = options?.placeExists ?? true;
  const ownerUserId = options?.ownerUserId ?? OWNER_USER_ID;

  const placeAddonRepositoryFns = {
    findByPlaceId: vi.fn(async () => []),
    findActiveByPlaceId: vi.fn(async () => []),
    findRateRulesByAddonIds: vi.fn(async () => []),
    deleteByPlaceId: vi.fn(async () => undefined),
    createOne: vi.fn(async (data) => {
      addonCount += 1;
      return createPlaceAddonRecord(`addon-${addonCount}`, {
        placeId: data.placeId,
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
        return createPlaceAddonRateRuleRecord(`rule-${ruleCount}`, {
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

  const placeRepositoryFns = {
    findById: vi.fn(async () =>
      placeExists ? { id: PLACE_ID, organizationId: ORG_ID } : null,
    ),
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

  const service = new PlaceAddonService(
    placeAddonRepositoryFns as unknown as IPlaceAddonRepository,
    placeRepositoryFns as unknown as IPlaceRepository,
    organizationMemberServiceFns as unknown as IOrganizationMemberService,
    { run } as unknown as TransactionManager,
  );

  return {
    service,
    txMarker,
    run,
    placeAddonRepositoryFns,
    placeRepositoryFns,
    organizationMemberServiceFns,
  };
};

describe("PlaceAddonService", () => {
  describe("setForPlace", () => {
    it("valid payload -> persists add-ons using shared transaction context", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createHourlyAddon(),
        createFlatAddon({ mode: "AUTO", flatFeeCents: 700 }),
      ]);

      const result = await harness.service.setForPlace(OWNER_USER_ID, payload);

      expect(harness.run).toHaveBeenCalledTimes(1);
      expect(harness.placeRepositoryFns.findById).toHaveBeenCalledWith(
        PLACE_ID,
        {
          tx: harness.txMarker,
        },
      );
      expect(
        harness.organizationMemberServiceFns.assertOrganizationPermission,
      ).toHaveBeenCalledWith(OWNER_USER_ID, ORG_ID, "place.manage", {
        tx: harness.txMarker,
      });
      expect(
        harness.placeAddonRepositoryFns.deleteByPlaceId,
      ).toHaveBeenCalledWith(PLACE_ID, { tx: harness.txMarker });
      expect(harness.placeAddonRepositoryFns.createOne).toHaveBeenCalledTimes(
        2,
      );
      expect(
        harness.placeAddonRepositoryFns.createManyRateRules,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 250,
            currency: DEFAULT_CURRENCY,
          }),
        ]),
        { tx: harness.txMarker },
      );
      expect(result).toHaveLength(2);
      expect(result[1]?.addon.flatFeeCurrency).toBe(DEFAULT_CURRENCY);
    });

    it("HOURLY add-on without rules -> throws validation error", async () => {
      const harness = createHarness();
      const payload = createPayload([createHourlyAddon({}, [])]);

      await expect(
        harness.service.setForPlace(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(PlaceAddonValidationError);
    });

    it("FLAT add-on missing fee fields -> throws validation error", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createFlatAddon({
          flatFeeCents: undefined,
        }),
      ]);

      await expect(
        harness.service.setForPlace(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(PlaceAddonValidationError);
    });

    it("overlapping rules on same day -> throws overlap error", async () => {
      const harness = createHarness();
      const payload = createPayload([
        createHourlyAddon({}, [
          {
            dayOfWeek: 2,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 250,
          },
          {
            dayOfWeek: 2,
            startMinute: 590,
            endMinute: 650,
            hourlyRateCents: 250,
          },
        ]),
      ]);

      await expect(
        harness.service.setForPlace(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(PlaceAddonOverlapError);
    });

    it("non-owner user -> throws OrganizationMemberPermissionDeniedError", async () => {
      const harness = createHarness({ ownerUserId: "someone-else" });
      const payload = createPayload([createFlatAddon()]);

      await expect(
        harness.service.setForPlace(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(OrganizationMemberPermissionDeniedError);
    });

    it("missing place -> throws PlaceNotFoundError", async () => {
      const harness = createHarness({ placeExists: false });
      const payload = createPayload([createFlatAddon()]);

      await expect(
        harness.service.setForPlace(OWNER_USER_ID, payload),
      ).rejects.toBeInstanceOf(PlaceNotFoundError);
    });
  });
});
