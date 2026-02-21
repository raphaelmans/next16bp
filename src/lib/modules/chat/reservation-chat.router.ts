import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import { ProfileNotFoundError } from "@/lib/modules/profile/errors/profile.errors";
import { ReservationNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";
import {
  adminProcedure,
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  ReservationChatGuestReservationNotSupportedError,
  ReservationChatNotAvailableError,
  ReservationChatNotParticipantError,
} from "./errors/reservation-chat.errors";
import { makeReservationChatService } from "./factories/reservation-chat.factory";
import { SendChatMessageSchema } from "./schemas/send-chat-message.schema";

function handleReservationChatError(error: unknown): never {
  if (
    error instanceof ReservationNotFoundError ||
    error instanceof ProfileNotFoundError ||
    error instanceof CourtNotFoundError ||
    error instanceof PlaceNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof ReservationChatNotParticipantError ||
    error instanceof ReservationChatNotAvailableError ||
    error instanceof NotOrganizationOwnerError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ReservationChatGuestReservationNotSupportedError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
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

export const reservationChatRouter = router({
  getSession: protectedRateLimitedProcedure("chatSession")
    .input(
      z.object({
        reservationId: S.ids.generic,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationChatService();
        const session = await service.getSession(
          ctx.userId,
          input.reservationId,
          {
            id: ctx.userId,
            name: ctx.session.email || ctx.userId,
          },
        );

        ctx.log.info(
          {
            event: "reservation_chat.session_issued",
            reservationId: input.reservationId,
          },
          "Reservation chat session issued",
        );

        return session;
      } catch (error) {
        handleReservationChatError(error);
      }
    }),

  getThreadMetas: protectedProcedure
    .input(
      z.object({
        reservationIds: z.array(S.ids.generic).max(30),
        includeArchived: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationChatService();
        return await service.getThreadMetas(ctx.userId, input.reservationIds, {
          includeArchived: input.includeArchived,
        });
      } catch (error) {
        handleReservationChatError(error);
      }
    }),

  sendMessage: protectedRateLimitedProcedure("chatSend")
    .input(
      z
        .object({
          reservationId: S.ids.generic,
        })
        .merge(SendChatMessageSchema),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationChatService();
        await service.sendMessage(ctx.userId, input.reservationId, {
          text: input.text,
          attachments: input.attachments,
        });

        return { ok: true };
      } catch (error) {
        handleReservationChatError(error);
      }
    }),

  listTranscriptSnapshots: adminProcedure
    .input(
      z.object({
        reservationId: S.ids.generic,
      }),
    )
    .query(async ({ input }) => {
      try {
        const service = makeReservationChatService();
        return await service.listTranscriptSnapshots(input.reservationId);
      } catch (error) {
        handleReservationChatError(error);
      }
    }),

  captureTranscriptSnapshot: adminProcedure
    .input(
      z.object({
        reservationId: S.ids.generic,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationChatService();
        return await service.captureTranscriptSnapshot(
          ctx.userId,
          input.reservationId,
        );
      } catch (error) {
        handleReservationChatError(error);
      }
    }),
});
