import { describe, expect, it, vi } from "vitest";
import { ProfileNotFoundError } from "@/lib/modules/profile/errors/profile.errors";
import { ProfileService } from "@/lib/modules/profile/services/profile.service";
import { STORAGE_BUCKETS } from "@/lib/modules/storage/dtos";
import type { ProfileRecord } from "@/lib/shared/infra/db/schema";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const PROFILE_ID_ALT = "33333333-3333-4333-8333-333333333333";
const AVATAR_URL = "https://cdn.example.com/avatars/u1.png";

type ProfileServiceDeps = ConstructorParameters<typeof ProfileService>;

const toProfileRecord = (value: Partial<ProfileRecord> = {}): ProfileRecord =>
  ({
    id: PROFILE_ID,
    userId: USER_ID,
    displayName: "Player One",
    email: "player@example.com",
    phoneNumber: "+639171234567",
    avatarUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...value,
  }) as ProfileRecord;

const createHarness = () => {
  const profileRepositoryFns = {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const tx = { txId: "tx-1" };
  const run = vi.fn(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx));
  const storageServiceFns = {
    upload: vi.fn(),
    download: vi.fn(),
    delete: vi.fn(),
    getPublicUrl: vi.fn(),
    createSignedUrl: vi.fn(),
  };

  const service = new ProfileService(
    profileRepositoryFns as unknown as ProfileServiceDeps[0],
    { run } as unknown as ProfileServiceDeps[1],
    storageServiceFns as unknown as ProfileServiceDeps[2],
  );

  return {
    service,
    tx,
    run,
    profileRepositoryFns,
    storageServiceFns,
  };
};

describe("ProfileService", () => {
  describe("getProfile", () => {
    it("existing profile -> returns profile", async () => {
      // Arrange
      const harness = createHarness();
      const profile = toProfileRecord();
      harness.profileRepositoryFns.findByUserId.mockResolvedValue(profile);

      // Act
      const result = await harness.service.getProfile(USER_ID);

      // Assert
      expect(result).toEqual(profile);
      expect(harness.profileRepositoryFns.findByUserId).toHaveBeenCalledWith(
        USER_ID,
      );
    });

    it("missing profile -> throws ProfileNotFoundError", async () => {
      // Arrange
      const harness = createHarness();
      harness.profileRepositoryFns.findByUserId.mockResolvedValue(null);

      // Act + Assert
      await expect(harness.service.getProfile(USER_ID)).rejects.toBeInstanceOf(
        ProfileNotFoundError,
      );
    });
  });

  describe("getProfileById", () => {
    it("existing profile id -> returns profile", async () => {
      // Arrange
      const harness = createHarness();
      const profile = toProfileRecord({ id: PROFILE_ID_ALT });
      harness.profileRepositoryFns.findById.mockResolvedValue(profile);

      // Act
      const result = await harness.service.getProfileById(PROFILE_ID_ALT);

      // Assert
      expect(result).toEqual(profile);
      expect(harness.profileRepositoryFns.findById).toHaveBeenCalledWith(
        PROFILE_ID_ALT,
      );
    });

    it("missing profile id -> throws ProfileNotFoundError", async () => {
      // Arrange
      const harness = createHarness();
      harness.profileRepositoryFns.findById.mockResolvedValue(null);

      // Act + Assert
      await expect(
        harness.service.getProfileById(PROFILE_ID_ALT),
      ).rejects.toBeInstanceOf(ProfileNotFoundError);
    });
  });

  describe("getOrCreateProfile", () => {
    it("existing profile -> returns profile without creating", async () => {
      // Arrange
      const harness = createHarness();
      const profile = toProfileRecord();
      harness.profileRepositoryFns.findByUserId.mockResolvedValue(profile);

      // Act
      const result = await harness.service.getOrCreateProfile(USER_ID);

      // Assert
      expect(result).toEqual(profile);
      expect(harness.run).not.toHaveBeenCalled();
      expect(harness.profileRepositoryFns.create).not.toHaveBeenCalled();
    });

    it("missing profile -> creates profile inside transaction", async () => {
      // Arrange
      const harness = createHarness();
      const createdProfile = toProfileRecord();
      harness.profileRepositoryFns.findByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      harness.profileRepositoryFns.create.mockResolvedValue(createdProfile);

      // Act
      const result = await harness.service.getOrCreateProfile(USER_ID);

      // Assert
      expect(result).toEqual(createdProfile);
      expect(harness.run).toHaveBeenCalledTimes(1);
      expect(harness.profileRepositoryFns.findByUserId).toHaveBeenNthCalledWith(
        1,
        USER_ID,
      );
      expect(harness.profileRepositoryFns.findByUserId).toHaveBeenNthCalledWith(
        2,
        USER_ID,
        { tx: harness.tx },
      );
      expect(harness.profileRepositoryFns.create).toHaveBeenCalledWith(
        { userId: USER_ID },
        { tx: harness.tx },
      );
    });
  });

  describe("updateProfile", () => {
    it("existing profile -> updates profile in transaction", async () => {
      // Arrange
      const harness = createHarness();
      const existingProfile = toProfileRecord();
      const updatedProfile = toProfileRecord({ displayName: "Player Prime" });
      const input = { displayName: "Player Prime" };

      harness.profileRepositoryFns.findByUserId.mockResolvedValue(
        existingProfile,
      );
      harness.profileRepositoryFns.update.mockResolvedValue(updatedProfile);

      // Act
      const result = await harness.service.updateProfile(USER_ID, input);

      // Assert
      expect(result).toEqual(updatedProfile);
      expect(harness.profileRepositoryFns.findByUserId).toHaveBeenCalledWith(
        USER_ID,
        { tx: harness.tx },
      );
      expect(harness.profileRepositoryFns.create).not.toHaveBeenCalled();
      expect(harness.profileRepositoryFns.update).toHaveBeenCalledWith(
        existingProfile.id,
        input,
        { tx: harness.tx },
      );
    });

    it("missing profile -> auto-creates then updates profile", async () => {
      // Arrange
      const harness = createHarness();
      const createdProfile = toProfileRecord();
      const updatedProfile = toProfileRecord({ displayName: "Auto Created" });
      const input = { displayName: "Auto Created" };

      harness.profileRepositoryFns.findByUserId.mockResolvedValue(null);
      harness.profileRepositoryFns.create.mockResolvedValue(createdProfile);
      harness.profileRepositoryFns.update.mockResolvedValue(updatedProfile);

      // Act
      const result = await harness.service.updateProfile(USER_ID, input);

      // Assert
      expect(result).toEqual(updatedProfile);
      expect(harness.profileRepositoryFns.create).toHaveBeenCalledWith(
        { userId: USER_ID },
        { tx: harness.tx },
      );
      expect(harness.profileRepositoryFns.update).toHaveBeenCalledWith(
        createdProfile.id,
        input,
        { tx: harness.tx },
      );
    });
  });

  describe("uploadAvatar", () => {
    it("upload succeeds -> stores file and updates avatarUrl", async () => {
      // Arrange
      const harness = createHarness();
      const profile = toProfileRecord();
      const file = new File([new Uint8Array([1, 2, 3])], "avatar.png", {
        type: "image/png",
      });
      harness.profileRepositoryFns.findByUserId.mockResolvedValue(profile);
      harness.storageServiceFns.upload.mockResolvedValue({
        path: `${USER_ID}/avatar.png`,
        url: AVATAR_URL,
      });
      harness.profileRepositoryFns.update.mockResolvedValue(
        toProfileRecord({ avatarUrl: AVATAR_URL }),
      );

      // Act
      const result = await harness.service.uploadAvatar(USER_ID, file);

      // Assert
      expect(result).toBe(AVATAR_URL);
      expect(harness.storageServiceFns.upload).toHaveBeenCalledWith({
        bucket: STORAGE_BUCKETS.AVATARS,
        path: `${USER_ID}/avatar.png`,
        file,
        upsert: true,
      });
      expect(harness.profileRepositoryFns.update).toHaveBeenCalledWith(
        profile.id,
        { avatarUrl: AVATAR_URL },
      );
    });

    it("storage returns missing url -> throws and does not update profile", async () => {
      // Arrange
      const harness = createHarness();
      const profile = toProfileRecord();
      const file = new File([new Uint8Array([4, 5, 6])], "avatar.png", {
        type: "image/png",
      });
      harness.profileRepositoryFns.findByUserId.mockResolvedValue(profile);
      harness.storageServiceFns.upload.mockResolvedValue({
        path: `${USER_ID}/avatar.png`,
        url: null,
      });

      // Act + Assert
      await expect(harness.service.uploadAvatar(USER_ID, file)).rejects.toThrow(
        "Expected public URL for avatar upload",
      );
      expect(harness.profileRepositoryFns.update).not.toHaveBeenCalled();
    });
  });
});
