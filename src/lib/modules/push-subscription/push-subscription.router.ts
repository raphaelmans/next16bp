import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makePushSubscriptionService } from "./factories/push-subscription.factory";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1),
  expirationTime: z.string().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushSubscriptionRouter = router({
  getVapidPublicKey: protectedProcedure.query(() => {
    const publicKey = env.WEB_PUSH_VAPID_PUBLIC_KEY;
    return { configured: Boolean(publicKey), publicKey: publicKey ?? null };
  }),

  upsertMySubscription: protectedProcedure
    .input(
      z.object({
        subscription: subscriptionSchema,
        userAgent: z.string().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = makePushSubscriptionService();
      const userAgent = input.userAgent?.trim() || null;
      return service.upsertMySubscription(ctx.userId, {
        endpoint: input.subscription.endpoint,
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
        expirationTime: input.subscription.expirationTime ?? null,
        userAgent,
      });
    }),

  revokeMySubscription: protectedProcedure
    .input(
      z.union([
        z.object({ id: z.string().min(1) }),
        z.object({ endpoint: z.string().min(1) }),
      ]),
    )
    .mutation(async ({ input, ctx }) => {
      const service = makePushSubscriptionService();
      const result = await service.revokeMySubscription(ctx.userId, input);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Push subscription not found",
        });
      }
      return result;
    }),
});
