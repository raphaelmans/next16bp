import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import { UpdateProfileSchema } from "./dtos/update-profile.dto";
import { makeProfileService } from "./factories/profile.factory";

export const profileRouter = router({
  /**
   * Get current user's profile (auto-creates if missing).
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const profileService = makeProfileService();
    return profileService.getOrCreateProfile(ctx.userId, ctx.session.email);
  }),

  /**
   * Update current user's profile.
   */
  update: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const profileService = makeProfileService();
      return profileService.updateProfile(ctx.userId, input, ctx.session.email);
    }),
});
