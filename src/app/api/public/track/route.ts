import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/shared/infra/http/error-handler";
import { logger } from "@/shared/infra/logger";
import { ValidationError } from "@/shared/kernel/errors";
import type { ApiErrorResponse, ApiResponse } from "@/shared/kernel/response";
import { wrapResponse } from "@/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const forbiddenKeys = new Set(["email", "phone", "phonenumber", "fullname"]);

const trackEventSchema = z.object({
  event: z
    .string()
    .min(1)
    .max(120)
    .regex(/^funnel\.[a-z0-9_.-]+$/),
  properties: z.record(z.string(), z.unknown()).optional(),
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

export async function POST(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
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

    logger.info(
      {
        event: payload.event,
        requestId,
        properties: payload.properties ?? {},
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
