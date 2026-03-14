import { describe, expect, it, vi } from "vitest";
import {
  CoachAlreadyExistsError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import { CoachService } from "@/lib/modules/coach/services/coach.service";
import type { CoachRecord, ProfileRecord } from "@/lib/shared/infra/db/schema";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  profileId: "33333333-3333-4333-8333-333333333333",
  sportA: "44444444-4444-4444-8444-444444444444",
  sportB: "55555555-5555-4555-8555-555555555555",
};

type CoachServiceDeps = ConstructorParameters<typeof CoachService>;

const createCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: TEST_IDS.userId,
    profileId: TEST_IDS.profileId,
    name: "Alex Ace",
    slug: "alex-ace",
    tagline: "High-performance coach",
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
    createdAt: new Date("2026-03-14T00:00:00.000Z"),
    updatedAt: new Date("2026-03-14T00:00:00.000Z"),
    ...value,
  }) as CoachRecord;

const createProfileRecord = (
  value: Partial<ProfileRecord> = {},
): ProfileRecord =>
  ({
    id: TEST_IDS.profileId,
    userId: TEST_IDS.userId,
    displayName: null,
    email: null,
    phoneNumber: null,
    avatarUrl: null,
    createdAt: new Date("2026-03-14T00:00:00.000Z"),
    updatedAt: new Date("2026-03-14T00:00:00.000Z"),
    ...value,
  }) as ProfileRecord;

const createCoachDetails = () => ({
  coach: createCoachRecord(),
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

const createHarness = () => {
  const coachRepository = {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findBySlug: vi.fn(),
    findByIdOrSlug: vi.fn(),
    findByIdForUpdate: vi.fn(),
    findWithDetails: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    replaceCoachSports: vi.fn(),
    replaceCertifications: vi.fn(),
    replaceSpecialties: vi.fn(),
    replaceSkillLevels: vi.fn(),
    replaceAgeGroups: vi.fn(),
    replaceSessionTypes: vi.fn(),
    replaceSessionDurations: vi.fn(),
    upsertContactDetail: vi.fn(),
  };
  const profileRepository = {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const tx = { txId: "tx-1" };
  const run = vi.fn(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx));

  const service = new CoachService(
    coachRepository as unknown as CoachServiceDeps[0],
    profileRepository as unknown as CoachServiceDeps[1],
    { run } as unknown as CoachServiceDeps[2],
  );

  return { service, coachRepository, profileRepository, run, tx };
};

describe("CoachService", () => {
  it("createCoach creates a coach with profile bootstrap, slug resolution, and child entities", async () => {
    const harness = createHarness();
    const createdCoach = createCoachRecord({ slug: "alex-ace-mentor-2" });
    const profile = createProfileRecord();
    const details = {
      ...createCoachDetails(),
      coach: createdCoach,
    };

    harness.coachRepository.findByUserId.mockResolvedValue(null);
    harness.profileRepository.findByUserId.mockResolvedValue(null);
    harness.profileRepository.create.mockResolvedValue(profile);
    harness.coachRepository.findBySlug
      .mockResolvedValueOnce(
        createCoachRecord({ id: "taken", slug: "alex-ace-mentor" }),
      )
      .mockResolvedValueOnce(null);
    harness.coachRepository.create.mockResolvedValue(createdCoach);
    harness.coachRepository.findWithDetails.mockResolvedValue(details);

    const result = await harness.service.createCoach(TEST_IDS.userId, {
      name: "Alex Ace Mentor",
      sportIds: [TEST_IDS.sportA, TEST_IDS.sportA, TEST_IDS.sportB],
      specialties: ["Footwork", "Footwork", "Defense"],
      certifications: [
        { name: "PTR", issuingBody: "PTR", level: "L1" },
        { name: "  ", issuingBody: "Ignore", level: "Ignore" },
      ],
      skillLevels: ["BEGINNER", "ADVANCED", "ADVANCED"],
      ageGroups: ["ADULTS"],
      sessionTypes: ["PRIVATE", "PRIVATE"],
      sessionDurations: [60, 60, 90],
      phoneNumber: "+639171234567",
    });

    expect(result).toEqual(details);
    expect(harness.profileRepository.create).toHaveBeenCalledWith(
      { userId: TEST_IDS.userId },
      { tx: harness.tx },
    );
    expect(harness.coachRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: TEST_IDS.userId,
        profileId: TEST_IDS.profileId,
        name: "Alex Ace Mentor",
        slug: "alex-ace-mentor-2",
      }),
      { tx: harness.tx },
    );
    expect(harness.coachRepository.replaceCoachSports).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      [TEST_IDS.sportA, TEST_IDS.sportB],
      { tx: harness.tx },
    );
    expect(harness.coachRepository.replaceSpecialties).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      ["Footwork", "Defense"],
      { tx: harness.tx },
    );
    expect(harness.coachRepository.replaceCertifications).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      [{ name: "PTR", issuingBody: "PTR", level: "L1" }],
      { tx: harness.tx },
    );
    expect(harness.coachRepository.replaceSkillLevels).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      ["BEGINNER", "ADVANCED"],
      { tx: harness.tx },
    );
    expect(
      harness.coachRepository.replaceSessionDurations,
    ).toHaveBeenCalledWith(TEST_IDS.coachId, [60, 90], { tx: harness.tx });
  });

  it("createCoach rejects duplicate coaches for the same user", async () => {
    const harness = createHarness();
    harness.coachRepository.findByUserId.mockResolvedValue(createCoachRecord());

    await expect(
      harness.service.createCoach(TEST_IDS.userId, { name: "Alex Ace Mentor" }),
    ).rejects.toBeInstanceOf(CoachAlreadyExistsError);

    expect(harness.coachRepository.create).not.toHaveBeenCalled();
  });

  it("updateCoach replaces provided child entities and preserves existing slug when unchanged", async () => {
    const harness = createHarness();
    const existingCoach = createCoachRecord();
    const details = {
      ...createCoachDetails(),
      coach: createCoachRecord({ tagline: "Updated tagline" }),
    };

    harness.coachRepository.findByUserId.mockResolvedValue(existingCoach);
    harness.coachRepository.findByIdForUpdate.mockResolvedValue(existingCoach);
    harness.coachRepository.update.mockResolvedValue(details.coach);
    harness.coachRepository.findWithDetails.mockResolvedValue(details);

    const result = await harness.service.updateCoach(TEST_IDS.userId, {
      tagline: "Updated tagline",
      sportIds: [TEST_IDS.sportB],
      specialties: [],
      sessionDurations: [30],
    });

    expect(result).toEqual(details);
    expect(harness.coachRepository.update).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      expect.objectContaining({
        tagline: "Updated tagline",
      }),
      { tx: harness.tx },
    );
    expect(harness.coachRepository.findBySlug).not.toHaveBeenCalled();
    expect(harness.coachRepository.replaceCoachSports).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      [TEST_IDS.sportB],
      { tx: harness.tx },
    );
    expect(harness.coachRepository.replaceSpecialties).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      [],
      { tx: harness.tx },
    );
    expect(
      harness.coachRepository.replaceSessionDurations,
    ).toHaveBeenCalledWith(TEST_IDS.coachId, [30], { tx: harness.tx });
  });

  it("getCoachByUserId returns null when the user has no coach", async () => {
    const harness = createHarness();
    harness.coachRepository.findByUserId.mockResolvedValue(null);

    await expect(
      harness.service.getCoachByUserId(TEST_IDS.userId),
    ).resolves.toBeNull();
  });

  it("deactivateCoach throws when the coach does not exist", async () => {
    const harness = createHarness();
    harness.coachRepository.findByUserId.mockResolvedValue(null);

    await expect(
      harness.service.deactivateCoach(TEST_IDS.userId),
    ).rejects.toBeInstanceOf(CoachNotFoundError);
  });
});
