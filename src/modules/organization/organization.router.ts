import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  publicProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import { S } from "@/shared/kernel/schemas";
import {
  CreateOrganizationSchema,
  GetOrganizationLandingBySlugSchema,
  UpdateOrganizationProfileSchema,
  UpdateOrganizationSchema,
  UploadOrgLogoSchema,
} from "./dtos";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
  SlugAlreadyExistsError,
  UserAlreadyHasOrganizationError,
} from "./errors/organization.errors";
import { makeOrganizationService } from "./factories/organization.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleOrganizationError(error: unknown): never {
  if (error instanceof OrganizationNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof SlugAlreadyExistsError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof UserAlreadyHasOrganizationError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotOrganizationOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const organizationRouter = router({
  /**
   * Create a new organization (rate limited)
   */
  create: protectedRateLimitedProcedure("mutation")
    .input(CreateOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const organizationService = makeOrganizationService();
        const result = await organizationService.createOrganization(
          ctx.userId,
          input,
        );
        return result;
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Get organization by ID (public)
   */
  get: publicProcedure
    .input(z.object({ id: S.ids.organizationId }))
    .query(async ({ input }) => {
      try {
        const organizationService = makeOrganizationService();
        return await organizationService.getOrganization(input.id);
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Get organization by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: S.organization.slug }))
    .query(async ({ input }) => {
      try {
        const organizationService = makeOrganizationService();
        return await organizationService.getOrganizationBySlug(input.slug);
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Get organization landing page data by slug (public)
   */
  getLandingBySlug: publicProcedure
    .input(GetOrganizationLandingBySlugSchema)
    .query(async ({ input }) => {
      try {
        const organizationService = makeOrganizationService();
        return await organizationService.getLandingBySlug(input.slug);
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Get current user's organizations
   */
  my: protectedProcedure.query(async ({ ctx }) => {
    const organizationService = makeOrganizationService();
    return await organizationService.getMyOrganizations(ctx.userId);
  }),

  /**
   * Update organization (owner only)
   */
  update: protectedProcedure
    .input(UpdateOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const organizationService = makeOrganizationService();
        return await organizationService.updateOrganization(ctx.userId, input);
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Update organization profile (owner only)
   */
  updateProfile: protectedProcedure
    .input(UpdateOrganizationProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const organizationService = makeOrganizationService();
        return await organizationService.updateOrganizationProfile(
          ctx.userId,
          input,
        );
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  /**
   * Upload organization logo (FormData with file)
   * Owner only
   */
  uploadLogo: protectedRateLimitedProcedure("mutation")
    .input(UploadOrgLogoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const organizationService = makeOrganizationService();
        const url = await organizationService.uploadLogo(
          ctx.userId,
          input.organizationId,
          input.image,
        );
        return { url };
      } catch (error) {
        handleOrganizationError(error);
      }
    }),
});
