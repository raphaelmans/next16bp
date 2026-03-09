import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_IDS = {
  adminUserId: "11111111-1111-4111-8111-111111111111",
  placeId: "22222222-2222-4222-8222-222222222222",
  photoId: "33333333-3333-4333-8333-333333333333",
  organizationId: "44444444-4444-4444-8444-444444444444",
  requestId: "req-1",
};

const TEST_SLUG = "city-of-naga-pickleball-court";
const TEST_LOCATION = {
  province: "CEBU",
  city: "NAGA CITY",
};

const {
  mockAdminCourtService,
  mockRevalidatePublicPlaceDetailPaths,
  mockRevalidateHomeFeaturedVenues,
} = vi.hoisted(() => ({
  mockAdminCourtService: {
    uploadPhoto: vi.fn(),
    removePhoto: vi.fn(),
    getPlaceById: vi.fn(),
    updatePlace: vi.fn(),
    deactivatePlace: vi.fn(),
    activatePlace: vi.fn(),
    transferPlaceToOrganization: vi.fn(),
    recuratePlace: vi.fn(),
  },
  mockRevalidatePublicPlaceDetailPaths: vi.fn(),
  mockRevalidateHomeFeaturedVenues: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/modules/court/factories/court.factory", () => ({
  makeAdminCourtService: () => mockAdminCourtService,
}));

vi.mock("@/lib/shared/infra/cache/revalidate-public-place-detail", () => ({
  revalidatePublicPlaceDetailPaths: mockRevalidatePublicPlaceDetailPaths,
}));

vi.mock("@/lib/shared/infra/cache/revalidate-home-featured-venues", () => ({
  revalidateHomeFeaturedVenues: mockRevalidateHomeFeaturedVenues,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  RATE_LIMIT_TIERS: {
    default: { requests: 100, window: "1 m" },
    mutation: { requests: 30, window: "1 m" },
  },
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { adminCourtRouter } from "@/lib/modules/court/admin/admin-court.router";

const createCaller = () =>
  adminCourtRouter.createCaller({
    requestId: TEST_IDS.requestId,
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.adminUserId,
      email: "admin@example.com",
      role: "admin",
    },
    userId: TEST_IDS.adminUserId,
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as unknown,
  } as unknown as Parameters<typeof adminCourtRouter.createCaller>[0]);

const existingPlaceDetail = {
  place: {
    id: TEST_IDS.placeId,
    slug: TEST_SLUG,
    province: TEST_LOCATION.province,
    city: TEST_LOCATION.city,
    featuredRank: 1,
  },
} as const;

const updatedPlaceRecord = {
  id: TEST_IDS.placeId,
  slug: TEST_SLUG,
  province: TEST_LOCATION.province,
  city: TEST_LOCATION.city,
  featuredRank: 2,
} as const;

describe("adminCourtRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminCourtService.getPlaceById.mockResolvedValue(existingPlaceDetail);
    mockRevalidatePublicPlaceDetailPaths.mockResolvedValue(undefined);
    mockRevalidateHomeFeaturedVenues.mockResolvedValue(undefined);
  });

  it("uploadPhoto revalidates the slug URL for public venue pages", async () => {
    const caller = createCaller();
    const formData = new FormData();
    formData.set("placeId", TEST_IDS.placeId);
    formData.set(
      "image",
      new File(["photo"], "venue-photo.jpg", { type: "image/jpeg" }),
    );
    mockAdminCourtService.uploadPhoto.mockResolvedValue({
      url: "https://cdn.example.com/venue-photo.jpg",
    });

    await caller.uploadPhoto(formData);

    expect(mockAdminCourtService.getPlaceById).toHaveBeenCalledWith(
      TEST_IDS.adminUserId,
      { placeId: TEST_IDS.placeId },
    );
    expect(mockRevalidatePublicPlaceDetailPaths).toHaveBeenCalledWith({
      placeId: TEST_IDS.placeId,
      placeSlug: TEST_SLUG,
      requestId: TEST_IDS.requestId,
    });
  });

  it("removePhoto revalidates the slug URL for public venue pages", async () => {
    const caller = createCaller();
    mockAdminCourtService.removePhoto.mockResolvedValue(undefined);

    await caller.removePhoto({
      placeId: TEST_IDS.placeId,
      photoId: TEST_IDS.photoId,
    });

    expect(mockAdminCourtService.getPlaceById).toHaveBeenCalledWith(
      TEST_IDS.adminUserId,
      { placeId: TEST_IDS.placeId },
    );
    expect(mockRevalidatePublicPlaceDetailPaths).toHaveBeenCalledWith({
      placeId: TEST_IDS.placeId,
      placeSlug: TEST_SLUG,
      requestId: TEST_IDS.requestId,
    });
  });

  it("update revalidates the slug URL and location tags", async () => {
    const caller = createCaller();
    mockAdminCourtService.updatePlace.mockResolvedValue(updatedPlaceRecord);

    await caller.update({
      placeId: TEST_IDS.placeId,
      name: "City of Naga Pickleball Court",
      address: "6Q56+267, East Poblacion",
      city: TEST_LOCATION.city,
      province: TEST_LOCATION.province,
      latitude: "10.20754710",
      longitude: "123.76054850",
      extGPlaceId: "",
      featuredRank: 2,
      provinceRank: 0,
      facebookUrl: "",
      instagramUrl: "",
      phoneNumber: "",
      viberInfo: "",
      websiteUrl: "",
      otherContactInfo: "",
      courts: [
        {
          label: "Court 1",
          sportId: "a29c1302-067d-4de9-8508-2093a93c5d69",
          tierLabel: "",
        },
      ],
    });

    expect(mockRevalidatePublicPlaceDetailPaths).toHaveBeenCalledWith({
      placeId: TEST_IDS.placeId,
      placeSlug: TEST_SLUG,
      previousLocation: TEST_LOCATION,
      nextLocation: TEST_LOCATION,
      requestId: TEST_IDS.requestId,
    });
    expect(mockRevalidateHomeFeaturedVenues).toHaveBeenCalledWith(
      TEST_IDS.requestId,
    );
  });

  it("update skips featured-home revalidation when featured rank is unchanged", async () => {
    const caller = createCaller();
    mockAdminCourtService.updatePlace.mockResolvedValue({
      ...updatedPlaceRecord,
      featuredRank: 1,
    });

    await caller.update({
      placeId: TEST_IDS.placeId,
      featuredRank: 1,
      latitude: "",
      longitude: "",
      extGPlaceId: "",
      facebookUrl: "",
      instagramUrl: "",
      phoneNumber: "",
      viberInfo: "",
      websiteUrl: "",
      otherContactInfo: "",
    });

    expect(mockRevalidateHomeFeaturedVenues).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "deactivate",
      run: (caller: ReturnType<typeof createCaller>) =>
        caller.deactivate({
          placeId: TEST_IDS.placeId,
          reason: "Temporary maintenance update",
        }),
      mockMethod: "deactivatePlace" as const,
    },
    {
      name: "activate",
      run: (caller: ReturnType<typeof createCaller>) =>
        caller.activate({
          placeId: TEST_IDS.placeId,
        }),
      mockMethod: "activatePlace" as const,
    },
    {
      name: "transfer",
      run: (caller: ReturnType<typeof createCaller>) =>
        caller.transfer({
          placeId: TEST_IDS.placeId,
          targetOrganizationId: TEST_IDS.organizationId,
          autoVerifyAndEnable: true,
        }),
      mockMethod: "transferPlaceToOrganization" as const,
    },
    {
      name: "recurate",
      run: (caller: ReturnType<typeof createCaller>) =>
        caller.recurate({
          placeId: TEST_IDS.placeId,
          reason: "Return to curated listing",
        }),
      mockMethod: "recuratePlace" as const,
    },
  ])("$name revalidates the slug URL for public venue pages", async (test) => {
    const caller = createCaller();
    mockAdminCourtService[test.mockMethod].mockResolvedValue(
      updatedPlaceRecord,
    );

    await test.run(caller);

    expect(mockRevalidatePublicPlaceDetailPaths).toHaveBeenCalledWith({
      placeId: TEST_IDS.placeId,
      placeSlug: TEST_SLUG,
      requestId: TEST_IDS.requestId,
    });
  });
});
