import { describe, expect, it, vi } from "vitest";
import type { GetAvailabilityForCourtDTO } from "@/lib/modules/availability/dtos";
import { InvalidAvailabilityAddonSelectionError } from "@/lib/modules/availability/errors/availability.errors";
import { AvailabilityService } from "@/lib/modules/availability/services/availability.service";
import type {
  CourtAddonRecord,
  CourtRecord,
  PlaceRecord,
  PlaceVerificationRecord,
} from "@/lib/shared/infra/db/schema";

vi.mock("@/lib/env", () => ({
  env: {
    ENABLE_ADDON_PRICING_V2: true,
  },
}));

const COURT_ID = "court-1";
const PLACE_ID = "place-1";

type AvailabilityServiceDeps = ConstructorParameters<
  typeof AvailabilityService
>;

const toCourtRecord = (value: Partial<CourtRecord>): CourtRecord =>
  value as CourtRecord;
const toPlaceRecord = (value: Partial<PlaceRecord>): PlaceRecord =>
  value as PlaceRecord;
const toVerificationRecord = (
  value: Partial<PlaceVerificationRecord>,
): PlaceVerificationRecord => value as PlaceVerificationRecord;
const toCourtAddonRecord = (
  value: Partial<CourtAddonRecord>,
): CourtAddonRecord => value as CourtAddonRecord;

const createHarness = () => {
  const court = toCourtRecord({
    id: COURT_ID,
    label: "Court 1",
    placeId: PLACE_ID,
    isActive: true,
  });
  const place = toPlaceRecord({
    id: PLACE_ID,
    timeZone: "Asia/Manila",
    placeType: "RESERVABLE",
    isActive: true,
  });
  const verification = toVerificationRecord({
    placeId: PLACE_ID,
    status: "VERIFIED",
    reservationsEnabled: true,
  });

  const courtRepositoryFns = {
    findById: vi.fn(async () => court),
  };
  const placeRepositoryFns = {
    findById: vi.fn(async () => place),
  };
  const placeVerificationRepositoryFns = {
    findByPlaceId: vi.fn(async () => verification),
  };
  const courtHoursRepositoryFns = {
    findByCourtIds: vi.fn(async () => []),
  };
  const courtRateRuleRepositoryFns = {
    findByCourtIds: vi.fn(async () => []),
  };
  const courtAddonRepositoryFns = {
    findActiveByCourtIds: vi.fn(async () => [
      toCourtAddonRecord({
        id: "court-addon-1",
        courtId: COURT_ID,
        isActive: true,
      }),
    ]),
    findRateRulesByAddonIds: vi.fn(async () => []),
  };
  const placeAddonRepositoryFns = {
    findActiveByPlaceId: vi.fn(async () => []),
    findRateRulesByAddonIds: vi.fn(async () => []),
  };
  const reservationRepositoryFns = {
    findOverlappingActiveByCourtIds: vi.fn(async () => []),
  };
  const courtBlockRepositoryFns = {
    findOverlappingByCourtIds: vi.fn(async () => []),
  };
  const courtPriceOverrideRepositoryFns = {
    findOverlappingByCourtIds: vi.fn(async () => []),
  };

  const service = new AvailabilityService(
    courtRepositoryFns as unknown as AvailabilityServiceDeps[0],
    placeRepositoryFns as unknown as AvailabilityServiceDeps[1],
    placeVerificationRepositoryFns as unknown as AvailabilityServiceDeps[2],
    courtHoursRepositoryFns as unknown as AvailabilityServiceDeps[3],
    courtRateRuleRepositoryFns as unknown as AvailabilityServiceDeps[4],
    courtAddonRepositoryFns as unknown as AvailabilityServiceDeps[5],
    placeAddonRepositoryFns as unknown as AvailabilityServiceDeps[6],
    reservationRepositoryFns as unknown as AvailabilityServiceDeps[7],
    courtBlockRepositoryFns as unknown as AvailabilityServiceDeps[8],
    courtPriceOverrideRepositoryFns as unknown as AvailabilityServiceDeps[9],
  );

  return { service };
};

const getFutureDateIso = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe("AvailabilityService addon selection validation", () => {
  it("getForCourt rejects selected add-ons that are not valid for the booking context", async () => {
    const harness = createHarness();
    const payload: GetAvailabilityForCourtDTO = {
      courtId: COURT_ID,
      date: getFutureDateIso(),
      durationMinutes: 60,
      selectedAddons: [{ addonId: "invalid-addon", quantity: 1 }],
    };

    await expect(harness.service.getForCourt(payload)).rejects.toBeInstanceOf(
      InvalidAvailabilityAddonSelectionError,
    );
  });
});
