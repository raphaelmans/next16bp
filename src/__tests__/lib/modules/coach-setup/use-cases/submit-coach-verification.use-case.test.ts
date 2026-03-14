import { describe, expect, it, vi } from "vitest";
import { CoachNotFoundError } from "@/lib/modules/coach/errors/coach.errors";
import { SubmitCoachVerificationUseCase } from "@/lib/modules/coach-setup/use-cases/submit-coach-verification.use-case";
import type { CoachRecord } from "@/lib/shared/infra/db/schema";
import { ValidationError } from "@/lib/shared/kernel/errors";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  profileId: "33333333-3333-4333-8333-333333333333",
};

const createCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: TEST_IDS.userId,
    profileId: TEST_IDS.profileId,
    name: "Coach Alex",
    slug: "coach-alex",
    tagline: "Movement-first coaching",
    bio: "Personalized sessions",
    introVideoUrl: null,
    yearsOfExperience: 6,
    playingBackground: null,
    coachingPhilosophy: null,
    city: "Makati",
    province: "Metro Manila",
    country: "PH",
    latitude: null,
    longitude: null,
    timeZone: "Asia/Manila",
    willingToTravel: false,
    onlineCoaching: false,
    baseHourlyRateCents: 1800,
    baseHourlyRateCurrency: "PHP",
    verificationStatus: "UNVERIFIED",
    verificationSubmittedAt: null,
    verifiedAt: null,
    isActive: true,
    featuredRank: 0,
    provinceRank: 0,
    createdAt: new Date("2026-03-15T00:00:00.000Z"),
    updatedAt: new Date("2026-03-15T00:00:00.000Z"),
    ...value,
  }) as CoachRecord;

const createHarness = () => {
  const coachRepository = {
    findByUserId: vi.fn(),
    findByIdForUpdate: vi.fn(),
    findWithDetails: vi.fn(),
    update: vi.fn(),
  };
  const coachSetupRepository = {
    findSetupSnapshotByUserId: vi.fn(),
  };
  const tx = { txId: "tx-1" };
  const run = vi.fn(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx));

  const useCase = new SubmitCoachVerificationUseCase(
    coachRepository as never,
    coachSetupRepository as never,
    { run } as never,
  );

  return {
    useCase,
    coachRepository,
    coachSetupRepository,
    run,
    tx,
  };
};

describe("SubmitCoachVerificationUseCase", () => {
  it("moves an eligible coach into pending verification", async () => {
    const harness = createHarness();
    const coach = createCoachRecord();

    harness.coachRepository.findByUserId.mockResolvedValue(coach);
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(coach);
    harness.coachSetupRepository.findSetupSnapshotByUserId.mockResolvedValue({
      coachId: TEST_IDS.coachId,
      name: "Coach Alex",
      tagline: "Movement-first coaching",
      bio: "Personalized sessions",
      city: "Makati",
      province: "Metro Manila",
      sportsCount: 1,
      hoursCount: 3,
      rateRuleCount: 2,
      paymentMethodCount: 1,
      verificationStatus: "UNVERIFIED",
    });
    harness.coachRepository.findWithDetails.mockResolvedValue({
      coach,
      contactDetail: null,
      sports: [],
      certifications: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          coachId: TEST_IDS.coachId,
          name: "PTR",
          issuingBody: "PTR",
          level: "Level 1",
          createdAt: new Date("2026-03-15T00:00:00.000Z"),
        },
      ],
      specialties: [],
      skillLevels: [],
      ageGroups: [],
      sessionTypes: [],
      sessionDurations: [],
      photos: [],
    });

    const result = await harness.useCase.execute(TEST_IDS.userId);

    expect(result).toEqual({
      coachId: TEST_IDS.coachId,
      verificationStatus: "PENDING",
      hasVerification: false,
    });
    expect(harness.coachRepository.update).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      expect.objectContaining({
        verificationStatus: "PENDING",
        verificationSubmittedAt: expect.any(Date),
        verifiedAt: null,
      }),
      { tx: harness.tx },
    );
  });

  it("blocks submission until the earlier setup steps are complete", async () => {
    const harness = createHarness();
    const coach = createCoachRecord();

    harness.coachRepository.findByUserId.mockResolvedValue(coach);
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(coach);
    harness.coachSetupRepository.findSetupSnapshotByUserId.mockResolvedValue({
      coachId: TEST_IDS.coachId,
      name: "Coach Alex",
      tagline: "Movement-first coaching",
      bio: "Personalized sessions",
      city: "Makati",
      province: "Metro Manila",
      sportsCount: 1,
      hoursCount: 0,
      rateRuleCount: 2,
      paymentMethodCount: 1,
      verificationStatus: "UNVERIFIED",
    });

    await expect(
      harness.useCase.execute(TEST_IDS.userId),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(harness.coachRepository.update).not.toHaveBeenCalled();
  });

  it("requires at least one saved certification with an issuing body", async () => {
    const harness = createHarness();
    const coach = createCoachRecord();

    harness.coachRepository.findByUserId.mockResolvedValue(coach);
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(coach);
    harness.coachSetupRepository.findSetupSnapshotByUserId.mockResolvedValue({
      coachId: TEST_IDS.coachId,
      name: "Coach Alex",
      tagline: "Movement-first coaching",
      bio: "Personalized sessions",
      city: "Makati",
      province: "Metro Manila",
      sportsCount: 1,
      hoursCount: 3,
      rateRuleCount: 2,
      paymentMethodCount: 1,
      verificationStatus: "UNVERIFIED",
    });
    harness.coachRepository.findWithDetails.mockResolvedValue({
      coach,
      contactDetail: null,
      sports: [],
      certifications: [],
      specialties: [],
      skillLevels: [],
      ageGroups: [],
      sessionTypes: [],
      sessionDurations: [],
      photos: [],
    });

    await expect(
      harness.useCase.execute(TEST_IDS.userId),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(harness.coachRepository.update).not.toHaveBeenCalled();
  });

  it("returns the verified state without rewriting an already approved coach", async () => {
    const harness = createHarness();
    const coach = createCoachRecord({
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2026-03-15T01:00:00.000Z"),
    });

    harness.coachRepository.findByUserId.mockResolvedValue(coach);
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(coach);

    await expect(harness.useCase.execute(TEST_IDS.userId)).resolves.toEqual({
      coachId: TEST_IDS.coachId,
      verificationStatus: "VERIFIED",
      hasVerification: true,
    });
    expect(harness.coachRepository.update).not.toHaveBeenCalled();
  });

  it("throws when the locked coach cannot be found", async () => {
    const harness = createHarness();
    harness.coachRepository.findByUserId.mockResolvedValue(createCoachRecord());
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      harness.useCase.execute(TEST_IDS.userId),
    ).rejects.toBeInstanceOf(CoachNotFoundError);
  });
});
