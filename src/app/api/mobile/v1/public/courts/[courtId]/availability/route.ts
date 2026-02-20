import { NextResponse } from "next/server";
import { GetAvailabilityForCourtSchema } from "@/lib/modules/availability/dtos";
import { makeAvailabilityService } from "@/lib/modules/availability/factories/availability.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
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

type Params = Promise<{ courtId: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const { courtId } = await context.params;
    const query = parseSearchParams(req);

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetAvailabilityForCourtSchema, {
      courtId,
      date: getStringParam(query, "date"),
      durationMinutes: getNumberParam(query, "durationMinutes"),
      includeUnavailable: getBooleanParam(query, "includeUnavailable"),
    });

    const service = makeAvailabilityService();
    const result = await service.getForCourt(input);

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
