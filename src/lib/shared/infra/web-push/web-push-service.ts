export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: string | null;
};

export type WebPushNotificationPayload = {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export type WebPushSendOptions = {
  ttlSeconds?: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  topic?: string;
};

export class WebPushError extends Error {
  statusCode?: number;
  body?: string;

  constructor(
    message: string,
    options?: { statusCode?: number; body?: string },
  ) {
    super(message);
    this.name = "WebPushError";
    this.statusCode = options?.statusCode;
    this.body = options?.body;
  }
}

/**
 * Strategy interface for Web Push delivery.
 */
export interface WebPushServiceStrategy {
  sendNotification(options: {
    subscription: WebPushSubscriptionPayload;
    payload: WebPushNotificationPayload;
    options?: WebPushSendOptions;
  }): Promise<{ statusCode: number }>;
}
