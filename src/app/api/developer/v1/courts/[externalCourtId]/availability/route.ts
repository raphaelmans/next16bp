import { NextResponse } from "next/server";
import { GetDeveloperAvailabilitySchema } from "@/lib/modules/developer-integration/dtos/developer-integration.dto";
import { makeDeveloperIntegrationService } from "@/lib/modules/developer-integration/factories/developer-integration.factory";
import { requireDeveloperApiKey } from "@/lib/shared/infra/auth/developer-api-key";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import {
  createRateLimitHeaders,
  enforceRateLimit,
  type RateLimitMetadata,
} from "@/lib/shared/infra/http/http-rate-limit";
import {
  getBooleanParam,
  getNumberParam,
  getStringParam,
  parseSearchParams,
} from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ externalCourtId: string }>;

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

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const auth = await requireDeveloperApiKey(req, ["availability.read"]);
    const { externalCourtId } = await context.params;
    const query = parseSearchParams(req);

    const rl = await enforceRateLimit({
      req,
      tier: "developerRead",
      requestId,
      identifier: auth.keyId,
    });
    if (!rl.ok) {
      rl.response.headers.set("x-request-id", requestId);
      return rl.response;
    }

    const input = validate(GetDeveloperAvailabilitySchema, {
      externalCourtId,
      date: getStringParam(query, "date"),
      durationMinutes: getNumberParam(query, "durationMinutes"),
      includeUnavailable: getBooleanParam(query, "includeUnavailable"),
    });

    const service = makeDeveloperIntegrationService();
    const result = await service.getAvailability(auth, input);
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
