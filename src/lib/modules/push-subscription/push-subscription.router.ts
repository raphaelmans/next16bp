import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/shared/infra/logger";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { makeWebPushService } from "@/lib/shared/infra/web-push/web-push.factory";
import type { WebPushNotificationPayload } from "@/lib/shared/infra/web-push/web-push-service";
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

  sendTestPush: protectedProcedure.mutation(async ({ ctx }) => {
    const service = makePushSubscriptionService();
    const subscriptions = await service.listMyActiveSubscriptions(ctx.userId);

    if (subscriptions.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No active push subscriptions found",
      });
    }

    const webPush = makeWebPushService();
    const payload: WebPushNotificationPayload = {
      title: "KudosCourts test",
      body: "Push notifications are working!",
      icon: "/logo.png",
      tag: "test.web_push.server",
      url: "/owner/settings",
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification({
          subscription: {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        });
        sent++;
      } catch (error) {
        failed++;
        logger.warn(
          {
            event: "push_subscription.test_push_failed",
            userId: ctx.userId,
            subscriptionId: sub.id,
            error,
          },
          "Test push notification failed for subscription",
        );
      }
    }

    logger.info(
      {
        event: "push_subscription.test_push_sent",
        userId: ctx.userId,
        sent,
        failed,
        total: subscriptions.length,
      },
      "Test push notification sent",
    );

    return { sent, failed };
  }),
});
