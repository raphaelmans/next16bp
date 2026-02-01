import { normalizePhMobile } from "@/common/phone";
import { env } from "@/lib/env";
import { logger } from "@/lib/shared/infra/logger";
import type { SmsPayload, SmsServiceStrategy } from "./sms-service";

type SemaphoreMessage = {
  message_id?: number;
  recipient?: string;
  status?: string;
  type?: string;
};

export class SemaphoreSmsService implements SmsServiceStrategy {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly senderName?: string;

  constructor() {
    const apiKey = env.SEMAPHORE_API_KEY;
    if (!apiKey) {
      throw new Error("SEMAPHORE_API_KEY is required to send SMS");
    }
    this.apiKey = apiKey;
    this.baseUrl = env.SEMAPHORE_BASE_URL ?? "https://api.semaphore.co/api/v4";
    this.senderName = env.SEMAPHORE_SENDER_NAME;
  }

  async sendSms(payload: SmsPayload): Promise<{ id?: string }> {
    const normalized = normalizePhMobile(payload.to);
    if (!normalized) {
      throw new Error("Semaphore SMS requires a valid phone number");
    }

    const endpoint = payload.priority ? "priority" : "messages";
    const url = `${this.baseUrl.replace(/\/$/, "")}/${endpoint}`;

    const toLast4 = normalized.slice(-4);

    const sendRequest = async (includeSenderName: boolean) => {
      const body = new URLSearchParams({
        apikey: this.apiKey,
        number: normalized,
        message: payload.message,
      });

      if (includeSenderName && this.senderName) {
        body.set("sendername", this.senderName);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const text = await response.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(
          `Semaphore returned non-JSON response (HTTP ${response.status})`,
        );
      }

      return { response, text, parsed };
    };

    const parseResponse = (parsed: unknown, text: string) => {
      if (!Array.isArray(parsed)) {
        throw new Error(`Unexpected Semaphore response: ${text}`);
      }

      const first = parsed[0] as SemaphoreMessage | undefined;
      return { id: first?.message_id ? String(first.message_id) : undefined };
    };

    const isInvalidSenderName = (bodyText: string) => {
      const hasSenderName = /sender\s*name|sendername/i.test(bodyText);
      const hasInvalid =
        /invalid|not\s+valid|not\s+approved|not\s+allowed|unregistered|unknown/i.test(
          bodyText,
        );
      return hasSenderName && hasInvalid;
    };

    const firstAttempt = await sendRequest(true);

    if (!firstAttempt.response.ok) {
      const bodyText = firstAttempt.text;
      if (this.senderName && isInvalidSenderName(bodyText)) {
        logger.warn(
          {
            event: "sms.semaphore.retry_without_sendername",
            endpoint,
            httpStatus: firstAttempt.response.status,
            senderName: this.senderName,
            toLast4,
            responseBody: bodyText.slice(0, 800),
          },
          "Semaphore sender name rejected; retrying without sendername",
        );

        const retryAttempt = await sendRequest(false);
        if (!retryAttempt.response.ok) {
          throw new Error(
            `Semaphore error (HTTP ${retryAttempt.response.status}): ${retryAttempt.text}`,
          );
        }

        return parseResponse(retryAttempt.parsed, retryAttempt.text);
      }

      throw new Error(
        `Semaphore error (HTTP ${firstAttempt.response.status}): ${bodyText}`,
      );
    }

    return parseResponse(firstAttempt.parsed, firstAttempt.text);
  }
}
