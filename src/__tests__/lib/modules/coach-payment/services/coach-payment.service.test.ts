import { describe, expect, it, vi } from "vitest";
import {
  CoachPaymentMethodConflictError,
  CoachPaymentMethodInactiveError,
} from "@/lib/modules/coach-payment/errors/coach-payment.errors";
import { CoachPaymentService } from "@/lib/modules/coach-payment/services/coach-payment.service";
import type {
  CoachPaymentMethodRecord,
  CoachRecord,
} from "@/lib/shared/infra/db/schema";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  defaultPaymentMethodId: "33333333-3333-4333-8333-333333333333",
  secondaryPaymentMethodId: "44444444-4444-4444-8444-444444444444",
};

type CoachPaymentServiceDeps = ConstructorParameters<
  typeof CoachPaymentService
>;

const now = new Date("2026-03-14T00:00:00.000Z");

const createCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: TEST_IDS.userId,
    profileId: "55555555-5555-4555-8555-555555555555",
    name: "Coach Alex",
    slug: "coach-alex",
    tagline: "Train smarter",
    bio: "Coach bio",
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
    baseHourlyRateCents: 1500,
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

const createPaymentMethodRecord = (
  value: Partial<CoachPaymentMethodRecord> = {},
): CoachPaymentMethodRecord =>
  ({
    id: TEST_IDS.defaultPaymentMethodId,
    coachId: TEST_IDS.coachId,
    type: "MOBILE_WALLET",
    provider: "GCASH",
    accountName: "Coach Alex",
    accountNumber: "09171234567",
    instructions: "Send proof after payment",
    isActive: true,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachPaymentMethodRecord;

const createHarness = () => {
  const tx = { txId: "coach-payment-tx" };
  const run = vi.fn(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx));

  const coachRepository = {
    findByUserId: vi.fn(async () => createCoachRecord()),
  };
  const paymentMethodRepository = {
    findById: vi.fn(),
    findByCoachId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(async () => undefined),
    clearDefault: vi.fn(async () => undefined),
  };

  const service = new CoachPaymentService(
    coachRepository as unknown as CoachPaymentServiceDeps[0],
    paymentMethodRepository as unknown as CoachPaymentServiceDeps[1],
    { run } as unknown as CoachPaymentServiceDeps[2],
  );

  return {
    service,
    coachRepository,
    paymentMethodRepository,
    run,
    tx,
  };
};

describe("CoachPaymentService", () => {
  it("listMethods returns the coach-owned payment methods", async () => {
    const harness = createHarness();
    const methods = [
      createPaymentMethodRecord(),
      createPaymentMethodRecord({
        id: TEST_IDS.secondaryPaymentMethodId,
        isDefault: false,
      }),
    ];
    harness.paymentMethodRepository.findByCoachId.mockResolvedValue(methods);

    await expect(
      harness.service.listMethods(TEST_IDS.userId, TEST_IDS.coachId),
    ).resolves.toEqual(methods);

    expect(harness.coachRepository.findByUserId).toHaveBeenCalledWith(
      TEST_IDS.userId,
      undefined,
    );
    expect(harness.paymentMethodRepository.findByCoachId).toHaveBeenCalledWith(
      TEST_IDS.coachId,
    );
  });

  it("createMethod makes the first active payment method the default", async () => {
    const harness = createHarness();
    harness.paymentMethodRepository.findByCoachId.mockResolvedValue([]);
    harness.paymentMethodRepository.create.mockResolvedValue(
      createPaymentMethodRecord(),
    );

    const result = await harness.service.createMethod(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      type: "MOBILE_WALLET",
      provider: "GCASH",
      accountName: "Coach Alex",
      accountNumber: "09171234567",
      instructions: "Send proof after payment",
      isActive: true,
    });

    expect(harness.run).toHaveBeenCalledTimes(1);
    expect(harness.paymentMethodRepository.clearDefault).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      { tx: harness.tx },
    );
    expect(harness.paymentMethodRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: TEST_IDS.coachId,
        isActive: true,
        isDefault: true,
      }),
      { tx: harness.tx },
    );
    expect(result.isDefault).toBe(true);
  });

  it("createMethod rejects duplicate provider and account-number pairs", async () => {
    const harness = createHarness();
    harness.paymentMethodRepository.findByCoachId.mockResolvedValue([
      createPaymentMethodRecord(),
    ]);

    await expect(
      harness.service.createMethod(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach Alex",
        accountNumber: "09171234567",
        instructions: undefined,
      }),
    ).rejects.toBeInstanceOf(CoachPaymentMethodConflictError);

    expect(harness.paymentMethodRepository.create).not.toHaveBeenCalled();
  });

  it("updateMethod clears prior defaults before promoting a different method", async () => {
    const harness = createHarness();
    const existing = createPaymentMethodRecord({
      id: TEST_IDS.secondaryPaymentMethodId,
      isDefault: false,
      provider: "BPI",
      type: "BANK",
      accountNumber: "1234567890",
    });
    harness.paymentMethodRepository.findById.mockResolvedValue(existing);
    harness.paymentMethodRepository.findByCoachId.mockResolvedValue([
      createPaymentMethodRecord(),
      existing,
    ]);
    harness.paymentMethodRepository.update.mockResolvedValue(
      createPaymentMethodRecord({
        id: TEST_IDS.secondaryPaymentMethodId,
        isDefault: true,
        provider: "BPI",
        type: "BANK",
        accountNumber: "1234567890",
      }),
    );

    const result = await harness.service.updateMethod(TEST_IDS.userId, {
      paymentMethodId: TEST_IDS.secondaryPaymentMethodId,
      isDefault: true,
    });

    expect(harness.paymentMethodRepository.clearDefault).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      { tx: harness.tx },
    );
    expect(harness.paymentMethodRepository.update).toHaveBeenCalledWith(
      TEST_IDS.secondaryPaymentMethodId,
      expect.objectContaining({ isDefault: true }),
      { tx: harness.tx },
    );
    expect(result.isDefault).toBe(true);
  });

  it("deleteMethod promotes the next active method after deleting the default", async () => {
    const harness = createHarness();
    harness.paymentMethodRepository.findById.mockResolvedValue(
      createPaymentMethodRecord(),
    );
    harness.paymentMethodRepository.findByCoachId.mockResolvedValue([
      createPaymentMethodRecord({
        id: TEST_IDS.secondaryPaymentMethodId,
        isDefault: false,
        provider: "MAYA",
        accountNumber: "09998887777",
      }),
    ]);
    harness.paymentMethodRepository.update.mockResolvedValue(
      createPaymentMethodRecord({
        id: TEST_IDS.secondaryPaymentMethodId,
        isDefault: true,
        provider: "MAYA",
        accountNumber: "09998887777",
      }),
    );

    await harness.service.deleteMethod(
      TEST_IDS.userId,
      TEST_IDS.defaultPaymentMethodId,
    );

    expect(harness.paymentMethodRepository.delete).toHaveBeenCalledWith(
      TEST_IDS.defaultPaymentMethodId,
      { tx: harness.tx },
    );
    expect(harness.paymentMethodRepository.update).toHaveBeenCalledWith(
      TEST_IDS.secondaryPaymentMethodId,
      { isDefault: true },
      { tx: harness.tx },
    );
  });

  it("setDefaultMethod rejects inactive payment methods", async () => {
    const harness = createHarness();
    harness.paymentMethodRepository.findById.mockResolvedValue(
      createPaymentMethodRecord({
        isActive: false,
        isDefault: false,
      }),
    );

    await expect(
      harness.service.setDefaultMethod(
        TEST_IDS.userId,
        TEST_IDS.defaultPaymentMethodId,
      ),
    ).rejects.toBeInstanceOf(CoachPaymentMethodInactiveError);

    expect(harness.paymentMethodRepository.clearDefault).not.toHaveBeenCalled();
    expect(harness.paymentMethodRepository.update).not.toHaveBeenCalled();
  });
});
