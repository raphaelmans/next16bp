import { describe, expect, it, vi } from "vitest";
import { NoPaymentMethodError } from "@/lib/modules/place-verification/errors/place-verification.errors";
import { PlaceVerificationService } from "@/lib/modules/place-verification/services/place-verification.service";
import type {
  OrganizationPaymentMethodRecord,
  OrganizationRecord,
  PlaceRecord,
  PlaceVerificationRecord,
} from "@/lib/shared/infra/db/schema";

type PlaceVerificationServiceDeps = ConstructorParameters<
  typeof PlaceVerificationService
>;

const OWNER_USER_ID = "owner-1";
const PLACE_ID = "place-1";
const ORGANIZATION_ID = "org-1";

const toPlaceRecord = (value: Partial<PlaceRecord>) => value as PlaceRecord;
const toOrganizationRecord = (value: Partial<OrganizationRecord>) =>
  value as OrganizationRecord;
const toVerificationRecord = (value: Partial<PlaceVerificationRecord>) =>
  value as PlaceVerificationRecord;
const toPaymentMethodRecord = (
  value: Partial<OrganizationPaymentMethodRecord>,
) => value as OrganizationPaymentMethodRecord;

const createHarness = (options?: {
  verificationStatus?: PlaceVerificationRecord["status"];
  verification?: PlaceVerificationRecord | null;
  paymentMethods?: OrganizationPaymentMethodRecord[];
}) => {
  const place = toPlaceRecord({
    id: PLACE_ID,
    organizationId: ORGANIZATION_ID,
  });
  const organization = toOrganizationRecord({
    id: ORGANIZATION_ID,
    ownerUserId: OWNER_USER_ID,
  });
  const verification =
    options && Object.hasOwn(options, "verification")
      ? (options.verification ?? null)
      : toVerificationRecord({
          placeId: PLACE_ID,
          status: options?.verificationStatus ?? "VERIFIED",
          reservationsEnabled: false,
        });
  const paymentMethods = options?.paymentMethods ?? [];

  const placeRepositoryFns = {
    findById: vi.fn(async () => place),
  };
  const organizationRepositoryFns = {
    findById: vi.fn(async () => organization),
  };
  const placeVerificationRepositoryFns = {
    findByPlaceId: vi.fn(async () => verification),
    upsert: vi.fn(async (value) =>
      toVerificationRecord({
        placeId: PLACE_ID,
        status: value.status,
        reservationsEnabled: value.reservationsEnabled,
        reservationsEnabledAt: value.reservationsEnabledAt,
        verifiedAt: value.verifiedAt ?? null,
        verifiedByUserId: value.verifiedByUserId ?? null,
      }),
    ),
  };
  const organizationPaymentMethodRepositoryFns = {
    findByOrganizationId: vi.fn(async () => paymentMethods),
  };

  const service = new PlaceVerificationService(
    placeVerificationRepositoryFns as unknown as PlaceVerificationServiceDeps[0],
    {} as unknown as PlaceVerificationServiceDeps[1],
    {} as unknown as PlaceVerificationServiceDeps[2],
    {} as unknown as PlaceVerificationServiceDeps[3],
    {} as unknown as PlaceVerificationServiceDeps[4],
    {} as unknown as PlaceVerificationServiceDeps[5],
    placeRepositoryFns as unknown as PlaceVerificationServiceDeps[6],
    organizationRepositoryFns as unknown as PlaceVerificationServiceDeps[7],
    {} as unknown as PlaceVerificationServiceDeps[8],
    organizationPaymentMethodRepositoryFns as unknown as PlaceVerificationServiceDeps[9],
  );

  return {
    service,
    placeVerificationRepositoryFns,
    organizationPaymentMethodRepositoryFns,
  };
};

describe("PlaceVerificationService.toggleReservations", () => {
  it("rejects enabling reservations when organization has no payment methods", async () => {
    const harness = createHarness({ paymentMethods: [] });

    await expect(
      harness.service.toggleReservations(OWNER_USER_ID, {
        placeId: PLACE_ID,
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(NoPaymentMethodError);

    expect(
      harness.organizationPaymentMethodRepositoryFns.findByOrganizationId,
    ).toHaveBeenCalledWith(ORGANIZATION_ID);
    expect(
      harness.placeVerificationRepositoryFns.upsert,
    ).not.toHaveBeenCalled();
  });

  it("enables reservations when organization has at least one payment method", async () => {
    const harness = createHarness({
      paymentMethods: [
        toPaymentMethodRecord({
          id: "pm-1",
          organizationId: ORGANIZATION_ID,
          isActive: true,
        }),
      ],
    });

    await harness.service.toggleReservations(OWNER_USER_ID, {
      placeId: PLACE_ID,
      enabled: true,
    });

    expect(
      harness.organizationPaymentMethodRepositoryFns.findByOrganizationId,
    ).toHaveBeenCalledWith(ORGANIZATION_ID);
    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      status: "VERIFIED",
      verifiedAt: null,
      verifiedByUserId: null,
      reservationsEnabled: true,
      reservationsEnabledAt: expect.any(Date),
    });
  });

  it("creates an unverified verification record when enabling reservations without an existing row", async () => {
    const harness = createHarness({
      verification: null,
      paymentMethods: [
        toPaymentMethodRecord({
          id: "pm-1",
          organizationId: ORGANIZATION_ID,
          isActive: true,
        }),
      ],
    });

    await harness.service.toggleReservations(OWNER_USER_ID, {
      placeId: PLACE_ID,
      enabled: true,
    });

    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      status: "UNVERIFIED",
      verifiedAt: null,
      verifiedByUserId: null,
      reservationsEnabled: true,
      reservationsEnabledAt: expect.any(Date),
    });
  });

  it("preserves non-verified status when enabling reservations", async () => {
    const harness = createHarness({
      verificationStatus: "PENDING",
      paymentMethods: [
        toPaymentMethodRecord({
          id: "pm-1",
          organizationId: ORGANIZATION_ID,
          isActive: true,
        }),
      ],
    });

    await harness.service.toggleReservations(OWNER_USER_ID, {
      placeId: PLACE_ID,
      enabled: true,
    });

    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      status: "PENDING",
      verifiedAt: null,
      verifiedByUserId: null,
      reservationsEnabled: true,
      reservationsEnabledAt: expect.any(Date),
    });
  });

  it("does not require payment methods when disabling reservations", async () => {
    const harness = createHarness({ paymentMethods: [] });

    await harness.service.toggleReservations(OWNER_USER_ID, {
      placeId: PLACE_ID,
      enabled: false,
    });

    expect(
      harness.organizationPaymentMethodRepositoryFns.findByOrganizationId,
    ).not.toHaveBeenCalled();
    expect(harness.placeVerificationRepositoryFns.upsert).toHaveBeenCalledWith({
      placeId: PLACE_ID,
      status: "VERIFIED",
      verifiedAt: null,
      verifiedByUserId: null,
      reservationsEnabled: false,
      reservationsEnabledAt: null,
    });
  });
});
