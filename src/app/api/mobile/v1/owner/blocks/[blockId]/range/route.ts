import { NextResponse } from "next/server";
import { UpdateCourtBlockRangeSchema } from "@/lib/modules/court-block/dtos";
import { makeCourtBlockService } from "@/lib/modules/court-block/factories/court-block.factory";
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

type Params = Promise<{ blockId: string }>;

export async function PATCH(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { blockId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(UpdateCourtBlockRangeSchema, {
      ...(raw as Record<string, unknown>),
      blockId,
    });

    const service = makeCourtBlockService();
    const result = await service.updateRange(session.userId, input);

    return NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
