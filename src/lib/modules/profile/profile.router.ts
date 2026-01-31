import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { UpdateProfileSchema, UploadAvatarSchema } from "./dtos";
import { ProfileNotFoundError } from "./errors/profile.errors";
import { makeProfileService } from "./factories/profile.factory";

export const profileRouter = router({
  /**
   * Get current user's profile (auto-creates if missing)
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(ctx.userId);
    return profile;
  }),

  /**
   * Update current user's profile
   */
  update: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const profileService = makeProfileService();
      const profile = await profileService.updateProfile(ctx.userId, input);
      return profile;
    }),

  /**
   * Upload avatar image for current user.
   * Accepts FormData with image file.
   */
  uploadAvatar: protectedProcedure
    .input(UploadAvatarSchema)
    .mutation(async ({ input, ctx }) => {
      const profileService = makeProfileService();
      const url = await profileService.uploadAvatar(ctx.userId, input.image);
      return { url };
    }),

  /**
   * Get profile by ID (for viewing other players)
   */
  getById: protectedProcedure
    .input(z.object({ id: S.ids.generic }))
    .query(async ({ input }) => {
      const profileService = makeProfileService();
      try {
        const profile = await profileService.getProfileById(input.id);
        return profile;
      } catch (error) {
        if (error instanceof ProfileNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
