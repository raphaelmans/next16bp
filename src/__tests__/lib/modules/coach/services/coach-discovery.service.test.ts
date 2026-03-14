import { describe, expect, it, vi } from "vitest";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import { CoachDiscoveryService } from "@/lib/modules/coach/services/coach-discovery.service";
import type { CoachRecord } from "@/lib/shared/infra/db/schema";

const TEST_IDS = {
  coachId: "22222222-2222-4222-8222-222222222222",
  userId: "11111111-1111-4111-8111-111111111111",
  profileId: "33333333-3333-4333-8333-333333333333",
};

const createCoachRecord = (value: Partial<CoachRecord> = {}): CoachRecord =>
  ({
    id: TEST_IDS.coachId,
    userId: TEST_IDS.userId,
    profileId: TEST_IDS.profileId,
    name: "Coach Alex",
    slug: "coach-alex",
    tagline: "Elite private lessons",
    bio: "Personalized coaching",
    introVideoUrl: null,
    yearsOfExperience: 8,
    playingBackground: null,
    coachingPhilosophy: null,
    city: "Cebu City",
    province: "Cebu",
    country: "PH",
    latitude: null,
    longitude: null,
    timeZone: "Asia/Manila",
    willingToTravel: false,
    onlineCoaching: true,
    baseHourlyRateCents: 1500,
    baseHourlyRateCurrency: "PHP",
    verificationStatus: "UNVERIFIED",
    verificationSubmittedAt: null,
    verifiedAt: null,
    isActive: true,
    featuredRank: 0,
    provinceRank: 0,
    createdAt: new Date("2026-03-14T00:00:00.000Z"),
    updatedAt: new Date("2026-03-14T00:00:00.000Z"),
    ...value,
  }) as CoachRecord;

const createHarness = () => {
  const coachRepository = {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findBySlug: vi.fn(),
    findByIdOrSlug: vi.fn(),
    findByIdForUpdate: vi.fn(),
    findWithDetails: vi.fn(),
    list: vi.fn(),
    listSummary: vi.fn(),
    listCardMediaByCoachIds: vi.fn(),
    listCardMetaByCoachIds: vi.fn(),
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
    getPublicStats: vi.fn(),
  };

  const service = new CoachDiscoveryService(coachRepository as never);

  return { service, coachRepository };
};

describe("CoachDiscoveryService", () => {
  it("getCoachByIdOrSlug returns enriched public details for an active coach", async () => {
    const harness = createHarness();
    const coach = createCoachRecord();
    harness.coachRepository.findByIdOrSlug.mockResolvedValue(coach);
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
    harness.coachRepository.listCardMetaByCoachIds.mockResolvedValue([
      {
        coachId: TEST_IDS.coachId,
        sports: [{ id: "sport-1", slug: "tennis", name: "Tennis" }],
        sessionTypes: ["PRIVATE", "GROUP"],
        baseHourlyRateCents: 1500,
        currency: "PHP",
        averageRating: 4.9,
        reviewCount: 17,
        verified: true,
      },
    ]);
    harness.coachRepository.listCardMediaByCoachIds.mockResolvedValue([
      {
        coachId: TEST_IDS.coachId,
        avatarUrl: "https://example.com/avatar.jpg",
        primaryPhotoUrl: "https://example.com/photo.jpg",
      },
    ]);

    const result = await harness.service.getCoachByIdOrSlug("coach-alex");

    expect(result.coach.id).toBe(TEST_IDS.coachId);
    expect(result.meta).toEqual({
      sports: [{ id: "sport-1", slug: "tennis", name: "Tennis" }],
      sessionTypes: ["PRIVATE", "GROUP"],
      baseHourlyRateCents: 1500,
      currency: "PHP",
      averageRating: 4.9,
      reviewCount: 17,
      verified: true,
    });
    expect(result.media).toEqual({
      avatarUrl: "https://example.com/avatar.jpg",
      primaryPhotoUrl: "https://example.com/photo.jpg",
    });
  });

  it("getCoachByIdOrSlug hides inactive coaches", async () => {
    const harness = createHarness();
    harness.coachRepository.findByIdOrSlug.mockResolvedValue(
      createCoachRecord({ isActive: false }),
    );

    await expect(
      harness.service.getCoachByIdOrSlug("coach-alex"),
    ).rejects.toBeInstanceOf(CoachNotActiveError);
  });

  it("getCoachByIdOrSlug throws when the coach does not exist", async () => {
    const harness = createHarness();
    harness.coachRepository.findByIdOrSlug.mockResolvedValue(null);

    await expect(
      harness.service.getCoachByIdOrSlug("missing-coach"),
    ).rejects.toBeInstanceOf(CoachNotFoundError);
  });

  it("listCoachSummaries delegates to the repository", async () => {
    const harness = createHarness();
    const payload = {
      items: [
        {
          coach: {
            id: TEST_IDS.coachId,
            slug: "coach-alex",
            name: "Coach Alex",
            tagline: "Elite private lessons",
            city: "Cebu City",
            province: "Cebu",
            baseHourlyRateCents: 1500,
            baseHourlyRateCurrency: "PHP",
            featuredRank: 0,
            provinceRank: 0,
          },
          meta: {
            sports: [],
            sessionTypes: ["PRIVATE"],
            averageRating: 4.5,
            reviewCount: 8,
            verified: false,
          },
        },
      ],
      total: 1,
    };
    harness.coachRepository.listSummary.mockResolvedValue(payload);

    const result = await harness.service.listCoachSummaries({
      q: "alex",
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(payload);
    expect(harness.coachRepository.listSummary).toHaveBeenCalledWith({
      q: "alex",
      limit: 10,
      offset: 0,
    });
  });
});
