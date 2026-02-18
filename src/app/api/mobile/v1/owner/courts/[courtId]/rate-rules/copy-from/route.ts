import { NextResponse } from "next/server";
import { CopyCourtRateRulesSchema } from "@/lib/modules/court-rate-rule/dtos";
import { makeCourtRateRuleService } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
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

type Params = Promise<{ courtId: string }>;

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { courtId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(CopyCourtRateRulesSchema, {
      ...(raw as Record<string, unknown>),
      targetCourtId: courtId,
    });

    const service = makeCourtRateRuleService();
    const result = await service.copyFromCourt(
      session.userId,
      input.sourceCourtId,
      input.targetCourtId,
    );

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
