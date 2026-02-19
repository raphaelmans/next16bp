import { NextResponse } from "next/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { makeSupportChatService } from "@/lib/modules/chat/factories/support-chat.factory";
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

const VerificationRequestSchema = z.object({
  placeVerificationRequestId: S.ids.generic,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ placeVerificationRequestId: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { placeVerificationRequestId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "chatSession",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(VerificationRequestSchema, {
      placeVerificationRequestId,
    });
    const service = makeSupportChatService();
    const result = await service.getVerificationSession({
      viewerUserId: session.userId,
      viewer: { id: session.userId, name: session.email || session.userId },
      placeVerificationRequestId: input.placeVerificationRequestId,
      ctx: { session } as never,
    });

    return NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
