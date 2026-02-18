import { NextResponse } from "next/server";
import { GetClaimRequestByIdSchema } from "@/lib/modules/claim-request/dtos";
import { makeClaimRequestService } from "@/lib/modules/claim-request/factories/claim-request.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ requestId: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestIdHeader = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { requestId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId: requestIdHeader,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetClaimRequestByIdSchema, { id: requestId });
    const service = makeClaimRequestService();
    const result = await service.getClaimRequestById(session.userId, input.id);

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestIdHeader);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
