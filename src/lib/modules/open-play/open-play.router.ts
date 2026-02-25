import { TRPCError } from "@trpc/server";
import { makeOpenPlayChatService } from "@/lib/modules/chat/factories/open-play-chat.factory";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  publicProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";
import {
  CancelOpenPlaySchema,
  CloseOpenPlaySchema,
  CreateOpenPlayFromReservationGroupSchema,
  CreateOpenPlayFromReservationSchema,
  DecideOpenPlayParticipantSchema,
  GetOpenPlayForReservationGroupSchema,
  GetOpenPlayForReservationSchema,
  GetOpenPlaySchema,
  LeaveOpenPlaySchema,
  ListOpenPlaysByPlaceSchema,
  RequestJoinOpenPlaySchema,
} from "./dtos";
import { makeOpenPlayService } from "./factories/open-play.factory";

function handleOpenPlayError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AuthorizationError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof ConflictError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof ValidationError || error instanceof BusinessRuleError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const openPlayRouter = router({
  listByPlace: publicProcedure
    .input(ListOpenPlaysByPlaceSchema)
    .query(async ({ input }) => {
      try {
        const service = makeOpenPlayService();
        return await service.listPublicByPlace(input, new Date());
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  getPublicDetail: publicProcedure
    .input(GetOpenPlaySchema)
    .query(async ({ input }) => {
      try {
        const service = makeOpenPlayService();
        return await service.getPublicDetail(input, new Date());
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  getDetail: protectedProcedure
    .input(GetOpenPlaySchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        return await service.getViewerDetail(
          ctx.userId,
          profile.id,
          input,
          new Date(),
        );
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  getForReservation: protectedProcedure
    .input(GetOpenPlayForReservationSchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        return await service.getForReservation(ctx.userId, profile.id, input);
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  createFromReservation: protectedRateLimitedProcedure("sensitive")
    .input(CreateOpenPlayFromReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        const created = await service.createFromReservation(
          ctx.userId,
          profile.id,
          input,
        );
        return { openPlayId: created.id };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  createFromReservationGroup: protectedRateLimitedProcedure("sensitive")
    .input(CreateOpenPlayFromReservationGroupSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        const created = await service.createFromReservationGroup(
          ctx.userId,
          profile.id,
          input,
        );
        return { openPlayId: created.id };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  getForReservationGroup: protectedProcedure
    .input(GetOpenPlayForReservationGroupSchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        return await service.getForReservationGroup(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  requestToJoin: protectedRateLimitedProcedure("mutation")
    .input(RequestJoinOpenPlaySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        const result = await service.requestToJoin(
          ctx.userId,
          profile.id,
          input,
        );
        return { status: result.participant.status };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  leave: protectedProcedure
    .input(LeaveOpenPlaySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        const result = await service.leave(ctx.userId, profile.id, input);

        if (result.previousStatus === "CONFIRMED") {
          const chatService = makeOpenPlayChatService();
          await chatService.removeMember(input.openPlayId, ctx.userId);
        }

        return { ok: true, status: result.participant?.status ?? null };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  decideParticipant: protectedProcedure
    .input(DecideOpenPlayParticipantSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const service = makeOpenPlayService();
        const result = await service.decideParticipant(
          ctx.userId,
          profile.id,
          input,
        );

        const nextStatus = result.participant.status;
        if (
          result.previousStatus === "CONFIRMED" &&
          nextStatus !== "CONFIRMED"
        ) {
          const chatService = makeOpenPlayChatService();
          await chatService.removeMember(
            result.openPlayId,
            result.targetUserId,
          );
        }

        return { status: result.participant.status };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  close: protectedProcedure
    .input(CloseOpenPlaySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);
        const service = makeOpenPlayService();
        const updated = await service.close(ctx.userId, profile.id, input);
        return { status: updated.status };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),

  cancel: protectedProcedure
    .input(CancelOpenPlaySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);
        const service = makeOpenPlayService();
        const updated = await service.cancel(ctx.userId, profile.id, input);
        return { status: updated.status };
      } catch (error) {
        handleOpenPlayError(error);
      }
    }),
});
