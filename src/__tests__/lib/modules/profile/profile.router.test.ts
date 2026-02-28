import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileNotFoundError } from "@/lib/modules/profile/errors/profile.errors";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  profileId: "22222222-2222-4222-8222-222222222222",
  profileIdOther: "33333333-3333-4333-8333-333333333333",
};

const mockProfileService = {
  getOrCreateProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  getProfileById: vi.fn(),
};

vi.mock("@/lib/modules/profile/factories/profile.factory", () => ({
  makeProfileService: () => mockProfileService,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { profileRouter } from "@/lib/modules/profile/profile.router";

const createCaller = () =>
  profileRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.userId,
      email: "player@example.com",
      role: "member",
    },
    userId: TEST_IDS.userId,
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
  } as unknown as Parameters<typeof profileRouter.createCaller>[0]);

describe("profileRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("me -> returns current profile via getOrCreateProfile", async () => {
    // Arrange
    const caller = createCaller();
    const profile = {
      id: TEST_IDS.profileId,
      userId: TEST_IDS.userId,
      displayName: "Player One",
    };
    mockProfileService.getOrCreateProfile.mockResolvedValue(profile);

    // Act
    const result = await caller.me();

    // Assert
    expect(result).toEqual(profile);
    expect(mockProfileService.getOrCreateProfile).toHaveBeenCalledWith(
      TEST_IDS.userId,
    );
  });

  it("update valid payload -> calls updateProfile and returns updated profile", async () => {
    // Arrange
    const caller = createCaller();
    const input = {
      displayName: "Updated Player",
      email: "updated@example.com",
      phoneNumber: "+639171234567",
    };
    mockProfileService.updateProfile.mockResolvedValue({
      id: TEST_IDS.profileId,
      userId: TEST_IDS.userId,
      ...input,
    });

    // Act
    const result = await caller.update(input);

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.profileId,
      userId: TEST_IDS.userId,
      displayName: input.displayName,
    });
    expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
      TEST_IDS.userId,
      input,
    );
  });

  it("uploadAvatar valid image -> returns url payload", async () => {
    // Arrange
    const caller = createCaller();
    const image = new File([new Uint8Array([1, 2, 3])], "avatar.png", {
      type: "image/png",
    });
    mockProfileService.uploadAvatar.mockResolvedValue(
      "https://cdn.example.com/avatars/u1.png",
    );

    // Act
    const result = await caller.uploadAvatar({ image });

    // Assert
    expect(result).toEqual({ url: "https://cdn.example.com/avatars/u1.png" });
    expect(mockProfileService.uploadAvatar).toHaveBeenCalledWith(
      TEST_IDS.userId,
      image,
    );
  });

  it("getById existing profile -> returns profile", async () => {
    // Arrange
    const caller = createCaller();
    mockProfileService.getProfileById.mockResolvedValue({
      id: TEST_IDS.profileIdOther,
      userId: "44444444-4444-4444-8444-444444444444",
      displayName: "Other Player",
    });

    // Act
    const result = await caller.getById({ id: TEST_IDS.profileIdOther });

    // Assert
    expect(result).toMatchObject({
      id: TEST_IDS.profileIdOther,
      displayName: "Other Player",
    });
    expect(mockProfileService.getProfileById).toHaveBeenCalledWith(
      TEST_IDS.profileIdOther,
    );
  });

  it("getById missing profile -> maps to NOT_FOUND", async () => {
    // Arrange
    const caller = createCaller();
    mockProfileService.getProfileById.mockRejectedValue(
      new ProfileNotFoundError(TEST_IDS.profileIdOther),
    );

    // Act + Assert
    await expect(
      caller.getById({ id: TEST_IDS.profileIdOther }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
