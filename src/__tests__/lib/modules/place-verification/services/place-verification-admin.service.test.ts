import { describe, expect, it, vi } from "vitest";
import { PlaceVerificationAdminService } from "@/lib/modules/place-verification/services/place-verification-admin.service";
import type {
  PlaceRecord,
  PlaceVerificationRecord,
  PlaceVerificationRequestRecord,
} from "@/lib/shared/infra/db/schema";

type PlaceVerificationAdminServiceDeps = ConstructorParameters<
  typeof PlaceVerificationAdminService
>;

const ADMIN_USER_ID = "admin-1";
const PLACE_ID = "place-1";
const REQUEST_ID = "request-1";
const ORGANIZATION_ID = "org-1";

const toPlaceRecord = (value: Partial<PlaceRecord>) => value as PlaceRecord;
const toVerificationRecord = (value: Partial<PlaceVerificationRecord>) =>
  value as PlaceVerificationRecord;
const toRequestRecord = (value: Partial<PlaceVerificationRequestRecord>) =>
  value as PlaceVerificationRequestRecord;

const createHarness = (options?: {
  verification?: Partial<PlaceVerificationRecord> | null;
}) => {
  const place = toPlaceRecord({
    id: PLACE_ID,
    name: "Venue",
  });
  const request = toRequestRecord({
    id: REQUEST_ID,
    placeId: PLACE_ID,
    organizationId: ORGANIZATION_ID,
    status: "PENDING",
  });
  const verification =
    options && Object.hasOwn(options, "verification")
      ? options.verification
        ? toVerificationRecord({
            placeId: PLACE_ID,
            status: "PENDING",
            reservationsEnabled: false,
            ...options.verification,
          })
        : null
      : toVerificationRecord({
          placeId: PLACE_ID,
          status: "PENDING",
          reservationsEnabled: true,
          reservationsEnabledAt: new Date("2026-01-01T00:00:00.000Z"),
        });

  const placeVerificationRepositoryFns = {
    findByPlaceId: vi.fn(async () => verification),
    upsert: vi.fn(async () => undefined),
  };
  const placeVerificationRequestRepositoryFns = {
    findByIdForUpdate: vi.fn(async () => request),
    update: vi.fn(async () => undefined),
  };
  const placeVerificationRequestEventRepositoryFns = {
    create: vi.fn(async () => undefined),
  };
  const placeVerificationRequestDocumentRepositoryFns = {
    findByRequestId: vi.fn(async () => []),
  };
  const placeRepositoryFns = {
    findByIdForUpdate: vi.fn(async () => place),
  };
  const organizationRepositoryFns = {};
  const notificationDeliveryServiceFns = {
    enqueueOwnerPlaceVerificationReviewed: vi.fn(async () => undefined),
  };
  const storageServiceFns = {};
  const transactionManager = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };

  const service = new PlaceVerificationAdminService(
    placeVerificationRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[0],
    placeVerificationRequestRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[1],
    placeVerificationRequestEventRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[2],
    placeVerificationRequestDocumentRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[3],
    transactionManager as unknown as PlaceVerificationAdminServiceDeps[4],
    placeRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[5],
    organizationRepositoryFns as unknown as PlaceVerificationAdminServiceDeps[6],
    notificationDeliveryServiceFns as unknown as PlaceVerificationAdminServiceDeps[7],
    storageServiceFns as unknown as PlaceVerificationAdminServiceDeps[8],
  );

  return {
    service,
    placeVerificationRepositoryFns,
  };
};

describe("PlaceVerificationAdminService.reject", () => {
  it("preserves enabled reservations when rejecting a venue", async () => {
    const harness = createHarness({
      verification: {
        status: "PENDING",
        reservationsEnabled: true,
        reservationsEnabledAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    await harness.service.reject(ADMIN_USER_ID, {
      requestId: REQUEST_ID,
      reviewNotes: "Need clearer documents",
    });

    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: PLACE_ID,
        status: "REJECTED",
        reservationsEnabled: true,
        reservationsEnabledAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      expect.any(Object),
    );
  });

  it("keeps reservations disabled when rejecting a venue that is not live", async () => {
    const harness = createHarness({
      verification: {
        status: "PENDING",
        reservationsEnabled: false,
        reservationsEnabledAt: null,
      },
    });

    await harness.service.reject(ADMIN_USER_ID, {
      requestId: REQUEST_ID,
      reviewNotes: "Need clearer documents",
    });

    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: PLACE_ID,
        status: "REJECTED",
        reservationsEnabled: false,
        reservationsEnabledAt: null,
      }),
      expect.any(Object),
    );
  });
});
