import { NextResponse } from "next/server";
import { makeChatService } from "@/lib/modules/chat/factories/chat.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
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
    const session = await requireMobileSession(req);
    const rl = await enforceRateLimit({
      req,
      tier: "chatSession",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const service = makeChatService();
    const result = await service.getAuth({
      id: session.userId,
      name: session.email || session.userId,
    });

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
