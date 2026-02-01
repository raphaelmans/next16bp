import { normalizePhMobile } from "@/common/phone";
import { env } from "@/lib/env";
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
    this.apiKey = env.SEMAPHORE_API_KEY;
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

    const body = new URLSearchParams({
      apikey: this.apiKey,
      number: normalized,
      message: payload.message,
    });

    if (this.senderName) {
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

    if (!response.ok) {
      throw new Error(`Semaphore error (HTTP ${response.status}): ${text}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(`Unexpected Semaphore response: ${text}`);
    }

    const first = parsed[0] as SemaphoreMessage | undefined;
    return { id: first?.message_id ? String(first.message_id) : undefined };
  }
}
