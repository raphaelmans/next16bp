import * as webpush from "web-push";
import { env } from "@/lib/env";
import {
  WebPushError,
  type WebPushServiceStrategy,
  type WebPushSubscriptionPayload,
} from "./web-push-service";

type WebPushLibError = Error & {
  statusCode?: number;
  body?: string;
};

export class WebPushService implements WebPushServiceStrategy {
  constructor() {
    const subject = env.WEB_PUSH_VAPID_SUBJECT;
    const publicKey = env.WEB_PUSH_VAPID_PUBLIC_KEY;
    const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY;

    if (!subject || !publicKey || !privateKey) {
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async sendNotification(options: {
    subscription: WebPushSubscriptionPayload;
    payload: {
      title: string;
      body?: string;
      icon?: string;
      badge?: string;
      url?: string;
      tag?: string;
      data?: Record<string, unknown>;
    };
    options?: {
      ttlSeconds?: number;
      urgency?: "very-low" | "low" | "normal" | "high";
      topic?: string;
    };
  }): Promise<{ statusCode: number }> {
    const subject = env.WEB_PUSH_VAPID_SUBJECT;
    const publicKey = env.WEB_PUSH_VAPID_PUBLIC_KEY;
    const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY;

    if (!subject || !publicKey || !privateKey) {
      throw new WebPushError("Web Push VAPID keys are not configured");
    }

    const subscription = this.toLibSubscription(options.subscription);
    const payload = JSON.stringify(options.payload);

    try {
      const response = await webpush.sendNotification(subscription, payload, {
        TTL: options.options?.ttlSeconds,
        urgency: options.options?.urgency,
        topic: options.options?.topic,
      });

      return { statusCode: response.statusCode };
    } catch (error) {
      const err = error as WebPushLibError;
      const statusCode = err.statusCode;
      const message = err.message || "Web Push send failed";

      throw new WebPushError(message, {
        statusCode,
        body: err.body,
      });
    }
  }

  private toLibSubscription(subscription: WebPushSubscriptionPayload) {
    const expirationTimeRaw = subscription.expirationTime;
    const expirationTime =
      typeof expirationTimeRaw === "string" && expirationTimeRaw.trim()
        ? Number(expirationTimeRaw)
        : null;

    return {
      endpoint: subscription.endpoint,
      expirationTime:
        typeof expirationTime === "number" && !Number.isNaN(expirationTime)
          ? expirationTime
          : null,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };
  }
}
