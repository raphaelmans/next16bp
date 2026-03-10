import { NextResponse } from "next/server";
import {
  DeleteDeveloperUnavailabilitySchema,
  UpsertDeveloperUnavailabilitySchema,
} from "@/lib/modules/developer-integration/dtos/developer-integration.dto";
import { makeDeveloperIntegrationService } from "@/lib/modules/developer-integration/factories/developer-integration.factory";
import { requireDeveloperApiKey } from "@/lib/shared/infra/auth/developer-api-key";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import {
  createRateLimitHeaders,
  enforceRateLimit,
  type RateLimitMetadata,
} from "@/lib/shared/infra/http/http-rate-limit";
import { parseJson } from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ externalCourtId: string; externalWindowId: string }>;

function applySuccessHeaders(
  response: NextResponse,
  requestId: string,
  rateLimit?: RateLimitMetadata,
) {
  response.headers.set("x-request-id", requestId);
  if (rateLimit) {
    const headers = createRateLimitHeaders(rateLimit);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export async function PUT(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const auth = await requireDeveloperApiKey(req, ["availability.write"]);
    const { externalCourtId, externalWindowId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "developerWrite",
      requestId,
      identifier: auth.keyId,
    });
    if (!rl.ok) {
      rl.response.headers.set("x-request-id", requestId);
      return rl.response;
    }

    const raw = await parseJson(req);
    const input = validate(UpsertDeveloperUnavailabilitySchema, {
      ...(raw as Record<string, unknown>),
      externalCourtId,
      externalWindowId,
    });

    const service = makeDeveloperIntegrationService();
    const result = await service.upsertUnavailability(auth, input);
    const response = NextResponse.json<ApiResponse<typeof result>>(
      wrapResponse(result),
    );

    return applySuccessHeaders(response, requestId, rl.rateLimit);
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, {
      status,
      headers: { "x-request-id": requestId },
    });
  }
}

export async function DELETE(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const auth = await requireDeveloperApiKey(req, ["availability.write"]);
    const { externalCourtId, externalWindowId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "developerWrite",
      requestId,
      identifier: auth.keyId,
    });
    if (!rl.ok) {
      rl.response.headers.set("x-request-id", requestId);
      return rl.response;
    }

    const input = validate(DeleteDeveloperUnavailabilitySchema, {
      externalCourtId,
      externalWindowId,
    });

    const service = makeDeveloperIntegrationService();
    const result = await service.deleteUnavailability(auth, input);
    const response = NextResponse.json<ApiResponse<typeof result>>(
      wrapResponse(result),
    );

    return applySuccessHeaders(response, requestId, rl.rateLimit);
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, {
      status,
      headers: { "x-request-id": requestId },
    });
  }
}
