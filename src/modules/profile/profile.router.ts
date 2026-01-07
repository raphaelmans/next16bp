import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/shared/infra/trpc/trpc";
import { makeProfileService } from "./factories/profile.factory";
import { UpdateProfileSchema } from "./dtos";
import { ProfileNotFoundError } from "./errors/profile.errors";

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
   * Get profile by ID (for viewing other players)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
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
