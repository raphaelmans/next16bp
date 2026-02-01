import { NextResponse } from "next/server";
import { z } from "zod";
import { V } from "@/common/schemas";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { logger } from "@/lib/shared/infra/logger";
import { ValidationError } from "@/lib/shared/kernel/errors";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const forbiddenKeys = new Set(["email", "phone", "phonenumber", "fullname"]);

const MAX_PROPERTY_KEYS = 25;

const trackEventSchema = z.object({
  event: z
    .string({ error: V.common.string.type.message })
    .trim()
    .min(V.tracking.event.min.value, { error: V.tracking.event.min.message })
    .max(V.tracking.event.max.value, { error: V.tracking.event.max.message })
    .regex(V.tracking.event.pattern.value, {
      error: V.tracking.event.pattern.message,
    }),
  properties: z
    .record(z.string({ error: V.common.string.type.message }), z.unknown())
    .optional(),
});

type TrackEventInput = z.infer<typeof trackEventSchema>;

type TrackResponse = {
  ok: true;
};

function ensureNoPii(properties?: Record<string, unknown>) {
  if (!properties) return;

  for (const key of Object.keys(properties)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      throw new ValidationError("Tracking payload contains PII", { key });
    }
  }
}

function getSafePropertyKeys(properties?: Record<string, unknown>) {
  if (!properties) return [] as string[];
  return Object.keys(properties)
    .map((key) => key.trim())
    .filter((key) => key.length > 0)
    .slice(0, MAX_PROPERTY_KEYS);
}

export async function POST(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
    const rl = await enforceRateLimit({ req, tier: "default", requestId });
    if (!rl.ok) {
      return rl.response;
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsed = trackEventSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid tracking payload", {
        issues: parsed.error.flatten(),
      });
    }

    const payload: TrackEventInput = parsed.data;
    ensureNoPii(payload.properties);

    const propertyKeys = getSafePropertyKeys(payload.properties);

    logger.info(
      {
        event: payload.event,
        requestId,
        propertyKeys,
        propertyCount: payload.properties
          ? Object.keys(payload.properties).length
          : 0,
      },
      "Funnel event logged",
    );

    return NextResponse.json<ApiResponse<TrackResponse>>(
      wrapResponse({ ok: true }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
