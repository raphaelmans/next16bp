import { TRPCError } from "@trpc/server";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";
import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  CreateCourtSchema,
  GetCourtByIdSchema,
  ListCourtsByPlaceSchema,
  UpdateCourtSchema,
} from "./dtos";
import {
  CourtNotFoundError,
  DuplicateCourtLabelError,
  NotCourtOwnerError,
} from "./errors/court.errors";
import { makeCourtManagementService } from "./factories/court.factory";

function handleCourtManagementError(error: unknown): never {
  if (error instanceof CourtNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof NotCourtOwnerError ||
    error instanceof OrganizationMemberPermissionDeniedError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof DuplicateCourtLabelError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const courtManagementRouter = router({
  create: protectedRateLimitedProcedure("mutation")
    .input(CreateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        const court = await service.createCourt(ctx.userId, input);
        if (court.placeId) {
          await revalidatePublicPlaceDetailPaths({
            placeId: court.placeId,
          });
        }
        return court;
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),
  update: protectedProcedure
    .input(UpdateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        const court = await service.updateCourt(ctx.userId, input);
        if (court.placeId) {
          await revalidatePublicPlaceDetailPaths({
            placeId: court.placeId,
          });
        }
        return court;
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),
  listByPlace: protectedProcedure
    .input(ListCourtsByPlaceSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.listCourtsByPlace(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),
  getById: protectedProcedure
    .input(GetCourtByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.getCourtById(ctx.userId, input.courtId);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),
});
