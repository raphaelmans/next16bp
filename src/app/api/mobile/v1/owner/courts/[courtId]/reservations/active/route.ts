import { NextResponse } from "next/server";
import { GetActiveForCourtRangeSchema } from "@/lib/modules/reservation/dtos";
import { makeReservationOwnerService } from "@/lib/modules/reservation/factories/reservation.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import {
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
    const session = await requireMobileSession(req);
    const { courtId } = await context.params;
    const query = parseSearchParams(req);

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetActiveForCourtRangeSchema, {
      courtId,
      startTime: getStringParam(query, "startTime"),
      endTime: getStringParam(query, "endTime"),
    });

    const service = makeReservationOwnerService();
    const result = await service.getActiveForCourtRange(session.userId, input);

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
