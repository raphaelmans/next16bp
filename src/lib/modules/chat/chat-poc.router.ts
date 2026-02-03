import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { env } from "@/lib/env";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError, NotFoundError } from "@/lib/shared/kernel/errors";
import { makeChatService } from "./factories/chat.factory";

const ensureChatPocEnabled = () => {
  if (process.env.NODE_ENV === "production" && env.CHAT_POC_ENABLED !== true) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Chat PoC not enabled",
      cause: new NotFoundError("Chat PoC not enabled"),
    });
  }
};

const mapHttpStatusToTrpcCode = (status: number) => {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "BAD_REQUEST";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 502:
      return "BAD_GATEWAY";
    case 503:
      return "SERVICE_UNAVAILABLE";
    case 504:
      return "GATEWAY_TIMEOUT";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
};

const toTrpcError = (error: AppError) =>
  new TRPCError({
    code: mapHttpStatusToTrpcCode(error.httpStatus),
    message: error.message,
    cause: error,
  });

export const chatPocRouter = router({
  getAuth: protectedProcedure.query(async ({ ctx }) => {
    ensureChatPocEnabled();

    const chatService = makeChatService();
    const user = {
      id: ctx.userId,
      name: ctx.session.email || ctx.userId,
    };

    try {
      return await chatService.getAuth(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw toTrpcError(error);
      }
      throw error;
    }
  }),

  getOrCreateDm: protectedProcedure
    .input(
      z.object({
        otherUserId: S.ids.generic,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ensureChatPocEnabled();

      const chatService = makeChatService();

      try {
        return await chatService.getOrCreateDm({
          userId: ctx.userId,
          otherUserId: input.otherUserId,
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw toTrpcError(error);
        }
        throw error;
      }
    }),
});
