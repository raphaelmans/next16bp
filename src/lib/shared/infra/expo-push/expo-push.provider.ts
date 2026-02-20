import { env } from "@/lib/env";
import {
  ExpoPushError,
  type ExpoPushPayload,
  type ExpoPushServiceStrategy,
} from "./expo-push-service";

type ExpoPushSendResponse = {
  data?: Array<{
    status?: "ok" | "error";
    id?: string;
    message?: string;
    details?: {
      error?: string;
      [key: string]: unknown;
    };
  }>;
  errors?: Array<{
    code?: string;
    message?: string;
    [key: string]: unknown;
  }>;
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export class ExpoPushService implements ExpoPushServiceStrategy {
  async sendPush(payload: ExpoPushPayload): Promise<{ ticketId?: string }> {
    const headers: Record<string, string> = {
      accept: "application/json",
      "accept-encoding": "gzip, deflate",
      "content-type": "application/json",
    };

    if (env.EXPO_PUSH_ACCESS_TOKEN) {
      headers.authorization = `Bearer ${env.EXPO_PUSH_ACCESS_TOKEN}`;
    }

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let parsed: ExpoPushSendResponse | null = null;

    try {
      parsed = JSON.parse(responseText) as ExpoPushSendResponse;
    } catch {
      throw new ExpoPushError("Expo push returned non-JSON response", {
        statusCode: response.status,
      });
    }

    if (!response.ok) {
      const firstError = parsed.errors?.[0];
      throw new ExpoPushError(
        firstError?.message ?? `Expo push HTTP error ${response.status}`,
        {
          statusCode: response.status,
          code: firstError?.code,
        },
      );
    }

    const ticket = parsed.data?.[0];
    if (!ticket) {
      throw new ExpoPushError("Expo push returned no ticket", {
        statusCode: response.status,
      });
    }

    if (ticket.status === "error") {
      throw new ExpoPushError(ticket.message ?? "Expo push ticket error", {
        statusCode: response.status,
        code: ticket.details?.error,
        details: ticket.details,
      });
    }

    if (ticket.status !== "ok") {
      throw new ExpoPushError("Expo push ticket has unknown status", {
        statusCode: response.status,
      });
    }

    return { ticketId: ticket.id };
  }
}
