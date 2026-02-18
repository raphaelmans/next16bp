import { NextResponse } from "next/server";
import { makeSportService } from "@/lib/modules/sport/factories/sport.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  try {
    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
    });
    if (!rl.ok) return rl.response;

    const service = makeSportService();
    const result = await service.listSports();

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
