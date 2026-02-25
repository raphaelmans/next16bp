import { env } from "@/lib/env";
import type {
  INotificationDispatchTriggerQueue,
  NotificationDispatchKickPayload,
} from "./notification-dispatch-trigger.queue";

const QSTASH_PUBLISH_URL = "https://qstash.upstash.io";
const DISPATCH_TRIGGER_PATH =
  "/api/internal/queue/dispatch-notification-delivery";

type QstashNotificationDispatchTriggerQueueOptions = {
  qstashToken: string;
  qstashUrl: string;
  destinationUrl: string;
};

export function resolveNotificationDispatchTriggerUrl() {
  if (env.NOTIFICATION_DISPATCH_TRIGGER_URL) {
    return env.NOTIFICATION_DISPATCH_TRIGGER_URL;
  }

  if (!env.NEXT_PUBLIC_APP_URL) {
    return null;
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${appUrl}${DISPATCH_TRIGGER_PATH}`;
}

export class QstashNotificationDispatchTriggerQueue
  implements INotificationDispatchTriggerQueue
{
  constructor(
    private readonly options: QstashNotificationDispatchTriggerQueueOptions,
  ) {}

  static fromEnv(): QstashNotificationDispatchTriggerQueue | null {
    if (!env.QSTASH_TOKEN) {
      return null;
    }

    const destinationUrl = resolveNotificationDispatchTriggerUrl();
    if (!destinationUrl) {
      return null;
    }

    return new QstashNotificationDispatchTriggerQueue({
      qstashToken: env.QSTASH_TOKEN,
      qstashUrl: env.QSTASH_URL?.replace(/\/$/, "") ?? QSTASH_PUBLISH_URL,
      destinationUrl,
    });
  }

  async publishDispatchKick(
    payload: NotificationDispatchKickPayload,
  ): Promise<void> {
    const url = `${this.options.qstashUrl}/v2/publish/${encodeURIComponent(this.options.destinationUrl)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.qstashToken}`,
        "content-type": "application/json",
        "upstash-method": "POST",
        "upstash-retries": "5",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `QSTASH_PUBLISH_FAILED:${response.status}:${body.slice(0, 500)}`,
      );
    }
  }
}
