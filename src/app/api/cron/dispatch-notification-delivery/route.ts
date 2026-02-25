import { addMinutes } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import pLimit from "p-limit";
import { env } from "@/lib/env";
import { MobilePushTokenRepository } from "@/lib/modules/mobile-push-token/repositories/mobile-push-token.repository";
import { NotificationDeliveryJobRepository } from "@/lib/modules/notification-delivery/repositories/notification-delivery-job.repository";
import { buildNotificationContent } from "@/lib/modules/notification-delivery/shared/domain";
import { PushSubscriptionRepository } from "@/lib/modules/push-subscription/repositories/push-subscription.repository";
import { getContainer } from "@/lib/shared/infra/container";
import { verifyCronAuth } from "@/lib/shared/infra/cron/cron-auth";
import { makeEmailService } from "@/lib/shared/infra/email/email.factory";
import { renderBrandedEmailHtml } from "@/lib/shared/infra/email/email-html-template";
import { makeExpoPushService } from "@/lib/shared/infra/expo-push/expo-push.factory";
import { ExpoPushError } from "@/lib/shared/infra/expo-push/expo-push-service";
import { logger } from "@/lib/shared/infra/logger";
import { makeSmsService } from "@/lib/shared/infra/sms/sms.factory";
import { makeWebPushService } from "@/lib/shared/infra/web-push/web-push.factory";
import { WebPushError } from "@/lib/shared/infra/web-push/web-push-service";

const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 360];
const BATCH_LIMIT = 25;
const DISPATCH_CONCURRENCY = 5;

const getAppUrl = (): string => {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return appUrl ?? "";
};

export async function GET(request: NextRequest) {
  const now = new Date();
  logger.info(
    {
      event: "notification_delivery.dispatch_started",
      path: request.nextUrl.pathname,
    },
    "Notification delivery dispatch started",
  );

  try {
    const auth = verifyCronAuth(request);
    if (!auth.ok) {
      const status = auth.response.status;
      const authEvent = {
        event: "notification_delivery.dispatch_auth_failed",
        status,
        hasCronSecret: Boolean(process.env.CRON_SECRET),
      };

      if (status >= 500) {
        logger.error(authEvent, "Notification delivery dispatch auth failed");
      } else {
        logger.warn(authEvent, "Notification delivery dispatch auth failed");
      }

      return auth.response;
    }

    const jobRepository = new NotificationDeliveryJobRepository(
      getContainer().db,
    );
    const pushSubscriptionRepository = new PushSubscriptionRepository(
      getContainer().db,
    );
    const mobilePushTokenRepository = new MobilePushTokenRepository(
      getContainer().db,
    );
    const jobs = await jobRepository.claimBatch({
      limit: BATCH_LIMIT,
      now,
      maxAttempts: MAX_ATTEMPTS,
    });

    if (!jobs.length) {
      return NextResponse.json({
        success: true,
        message: "No notification jobs to process",
        processed: 0,
        timestamp: now.toISOString(),
      });
    }

    const emailEnabled = env.NOTIFICATION_EMAIL_ENABLED !== false;
    const smsEnabled = env.NOTIFICATION_SMS_ENABLED !== false;
    const webPushEnabled = env.NOTIFICATION_WEB_PUSH_ENABLED !== false;
    const mobilePushEnabled = env.NOTIFICATION_MOBILE_PUSH_ENABLED !== false;

    let emailService: ReturnType<typeof makeEmailService> | null = null;
    let smsService: ReturnType<typeof makeSmsService> | null = null;
    let webPushService: ReturnType<typeof makeWebPushService> | null = null;
    let expoPushService: ReturnType<typeof makeExpoPushService> | null = null;
    let emailServiceInitError: string | null = null;
    let smsServiceInitError: string | null = null;
    let webPushServiceInitError: string | null = null;
    let expoPushServiceInitError: string | null = null;

    if (emailEnabled) {
      try {
        emailService = makeEmailService();
      } catch (error) {
        emailServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "EMAIL",
            error: emailServiceInitError,
          },
          "Email service initialization failed",
        );
      }
    }

    if (smsEnabled) {
      try {
        smsService = makeSmsService();
      } catch (error) {
        smsServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "SMS",
            error: smsServiceInitError,
          },
          "SMS service initialization failed",
        );
      }
    }

    if (webPushEnabled) {
      try {
        webPushService = makeWebPushService();
      } catch (error) {
        webPushServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "WEB_PUSH",
            error: webPushServiceInitError,
          },
          "Web Push service initialization failed",
        );
      }
    }

    if (mobilePushEnabled) {
      try {
        expoPushService = makeExpoPushService();
      } catch (error) {
        expoPushServiceInitError =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "notification_delivery.channel_init_failed",
            channel: "MOBILE_PUSH",
            error: expoPushServiceInitError,
          },
          "Expo Push service initialization failed",
        );
      }
    }

    const appUrl = getAppUrl();

    const counters = { sent: 0, failed: 0, skipped: 0 };

    const dispatchJob = async (job: (typeof jobs)[number]) => {
      if (job.channel === "EMAIL" && !emailEnabled) {
        counters.skipped += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:EMAIL",
          nextAttemptAt: null,
        });
        return;
      }

      if (job.channel === "SMS" && !smsEnabled) {
        counters.skipped += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:SMS",
          nextAttemptAt: null,
        });
        return;
      }

      if (job.channel === "WEB_PUSH" && !webPushEnabled) {
        counters.skipped += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:WEB_PUSH",
          nextAttemptAt: null,
        });
        return;
      }

      if (job.channel === "MOBILE_PUSH" && !mobilePushEnabled) {
        counters.skipped += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "DISABLED_CHANNEL:MOBILE_PUSH",
          nextAttemptAt: null,
        });
        return;
      }

      if (!job.target) {
        counters.skipped += 1;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError: "MISSING_TARGET",
          nextAttemptAt: null,
        });
        return;
      }

      const content = buildNotificationContent(
        job.eventType,
        job.payload as Record<string, unknown> | null,
        appUrl,
      );

      if ("error" in content) {
        counters.skipped += 1;
        const lastError =
          content.error === "UNSUPPORTED_EVENT_TYPE"
            ? `UNSUPPORTED_EVENT_TYPE:${job.eventType}`
            : content.error;
        await jobRepository.update(job.id, {
          status: "SKIPPED",
          lastError,
          nextAttemptAt: null,
        });
        return;
      }

      const { push, email, smsText } = content;
      const emailHtml = email
        ? renderBrandedEmailHtml(email.templateData)
        : null;

      try {
        const attemptCount = job.attemptCount + 1;
        let providerMessageId: string | undefined;

        if (job.channel === "EMAIL") {
          if (emailServiceInitError) {
            throw new Error(
              `EMAIL_SERVICE_INIT_FAILED:${emailServiceInitError}`,
            );
          }
          if (!emailService) {
            throw new Error("Email service is disabled");
          }
          if (!email) {
            throw new Error("MISSING_EMAIL_CONTENT");
          }
          const result = await emailService.sendEmail({
            from: env.CONTACT_US_FROM_EMAIL,
            to: job.target,
            subject: email.subject,
            text: email.text,
            ...(emailHtml ? { html: emailHtml } : {}),
            headers: {
              "Idempotency-Key": job.idempotencyKey,
            },
          });
          providerMessageId = result.id;
        } else if (job.channel === "SMS") {
          if (smsServiceInitError) {
            throw new Error(`SMS_SERVICE_INIT_FAILED:${smsServiceInitError}`);
          }
          if (!smsService) {
            throw new Error("SMS service is disabled");
          }
          if (!smsText) {
            throw new Error("MISSING_SMS_CONTENT");
          }
          const result = await smsService.sendSms({
            to: job.target,
            message: smsText,
          });
          providerMessageId = result.id;
        } else if (job.channel === "WEB_PUSH") {
          if (webPushServiceInitError) {
            throw new Error(
              `WEB_PUSH_SERVICE_INIT_FAILED:${webPushServiceInitError}`,
            );
          }
          if (!webPushService) {
            throw new Error("Web Push service is disabled");
          }

          const subscription = await pushSubscriptionRepository.findById(
            job.target,
          );
          if (!subscription || subscription.revokedAt) {
            counters.skipped += 1;
            await jobRepository.update(job.id, {
              status: "SKIPPED",
              attemptCount,
              lastError: subscription
                ? "SUBSCRIPTION_REVOKED"
                : "MISSING_SUBSCRIPTION",
              nextAttemptAt: null,
            });
            return;
          }

          const result = await webPushService.sendNotification({
            subscription: {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload: {
              title: push.title,
              body: push.body ?? undefined,
              icon: "/logo.png",
              url: push.url ?? undefined,
              tag: push.tag ?? undefined,
              data: {
                url: push.url ?? null,
                eventType: job.eventType,
              },
            },
            options: {
              ttlSeconds: 60 * 60,
              urgency: "high",
            },
          });

          providerMessageId = `HTTP:${result.statusCode}`;
        } else if (job.channel === "MOBILE_PUSH") {
          if (expoPushServiceInitError) {
            throw new Error(
              `MOBILE_PUSH_SERVICE_INIT_FAILED:${expoPushServiceInitError}`,
            );
          }
          if (!expoPushService) {
            throw new Error("Expo Push service is disabled");
          }

          const mobilePushToken = await mobilePushTokenRepository.findById(
            job.target,
          );
          if (!mobilePushToken || mobilePushToken.revokedAt) {
            counters.skipped += 1;
            await jobRepository.update(job.id, {
              status: "SKIPPED",
              attemptCount,
              lastError: mobilePushToken
                ? "MOBILE_PUSH_TOKEN_REVOKED"
                : "MISSING_MOBILE_PUSH_TOKEN",
              nextAttemptAt: null,
            });
            return;
          }

          const result = await expoPushService.sendPush({
            to: mobilePushToken.token,
            title: push.title,
            body: push.body ?? undefined,
            sound: "default",
            data: {
              url: push.url ?? null,
              eventType: job.eventType,
            },
          });

          providerMessageId = result.ticketId;
        } else {
          throw new Error(`Unsupported channel: ${job.channel}`);
        }

        counters.sent += 1;
        await jobRepository.update(job.id, {
          status: "SENT",
          attemptCount,
          providerMessageId,
          sentAt: now,
          lastError: null,
          nextAttemptAt: null,
        });
      } catch (error) {
        counters.failed += 1;
        const attemptCount = job.attemptCount + 1;
        const message =
          error instanceof Error ? error.message : "Unknown error";

        logger.error(
          {
            event: "notification_delivery.failed",
            jobId: job.id,
            eventType: job.eventType,
            channel: job.channel,
            attemptCount,
            error: message,
          },
          "Notification delivery failed",
        );

        if (error instanceof WebPushError) {
          const status = error.statusCode;
          if (status === 404 || status === 410) {
            counters.skipped += 1;
            counters.failed -= 1;

            try {
              await pushSubscriptionRepository.revokeById(job.target);
              await jobRepository.update(job.id, {
                status: "SKIPPED",
                attemptCount,
                lastError: "SUBSCRIPTION_GONE",
                nextAttemptAt: null,
              });
            } catch (persistenceError) {
              const persistenceMessage =
                persistenceError instanceof Error
                  ? persistenceError.message
                  : "Unknown persistence error";

              logger.error(
                {
                  event: "notification_delivery.persistence_failed",
                  jobId: job.id,
                  channel: job.channel,
                  error: persistenceMessage,
                },
                "Failed to persist web push revocation result",
              );

              return;
            }

            return;
          }
        }

        if (error instanceof ExpoPushError) {
          if (error.code === "DeviceNotRegistered") {
            counters.skipped += 1;
            counters.failed -= 1;

            try {
              await mobilePushTokenRepository.revokeById(job.target);
              await jobRepository.update(job.id, {
                status: "SKIPPED",
                attemptCount,
                lastError: "MOBILE_PUSH_TOKEN_NOT_REGISTERED",
                nextAttemptAt: null,
              });
            } catch (persistenceError) {
              const persistenceMessage =
                persistenceError instanceof Error
                  ? persistenceError.message
                  : "Unknown persistence error";

              logger.error(
                {
                  event: "notification_delivery.persistence_failed",
                  jobId: job.id,
                  channel: job.channel,
                  error: persistenceMessage,
                },
                "Failed to persist mobile push revocation result",
              );

              return;
            }

            return;
          }
        }

        const isFinalAttempt = attemptCount >= MAX_ATTEMPTS;
        const backoffIndex = Math.min(
          attemptCount - 1,
          BACKOFF_MINUTES.length - 1,
        );

        try {
          await jobRepository.update(job.id, {
            status: "FAILED",
            attemptCount,
            lastError: message,
            nextAttemptAt: isFinalAttempt
              ? null
              : addMinutes(now, BACKOFF_MINUTES[backoffIndex]),
          });
        } catch (persistenceError) {
          const persistenceMessage =
            persistenceError instanceof Error
              ? persistenceError.message
              : "Unknown persistence error";

          logger.error(
            {
              event: "notification_delivery.persistence_failed",
              jobId: job.id,
              channel: job.channel,
              error: persistenceMessage,
            },
            "Failed to persist notification failure state",
          );

          return;
        }
      }
    };

    const limit = pLimit(DISPATCH_CONCURRENCY);
    await Promise.allSettled(jobs.map((job) => limit(() => dispatchJob(job))));

    const {
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
    } = counters;

    const response = {
      success: failedCount === 0,
      processed: jobs.length,
      sentCount,
      failedCount,
      skippedCount,
      timestamp: now.toISOString(),
    };

    logger.info(
      {
        event: "notification_delivery.dispatch_complete",
        ...response,
      },
      "Notification delivery dispatch completed",
    );

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        event: "notification_delivery.dispatch_failed",
        error: message,
      },
      "Notification delivery dispatch failed",
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: now.toISOString(),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
