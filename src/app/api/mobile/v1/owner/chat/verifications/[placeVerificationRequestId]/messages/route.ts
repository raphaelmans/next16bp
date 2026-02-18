import { NextResponse } from "next/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { makeSupportChatService } from "@/lib/modules/chat/factories/support-chat.factory";
import { SendChatMessageSchema } from "@/lib/modules/chat/schemas/send-chat-message.schema";
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

const SendVerificationMessageSchema = z
  .object({
    placeVerificationRequestId: S.ids.generic,
  })
  .merge(SendChatMessageSchema);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ placeVerificationRequestId: string }>;

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { placeVerificationRequestId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "chatSend",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(SendVerificationMessageSchema, {
      ...(raw as Record<string, unknown>),
      placeVerificationRequestId,
    });

    const service = makeSupportChatService();
    await service.sendVerificationMessage({
      viewerUserId: session.userId,
      placeVerificationRequestId: input.placeVerificationRequestId,
      text: input.text,
      attachments: input.attachments,
      ctx: { session } as never,
    });

    return NextResponse.json<ApiResponse<{ ok: true }>>(
      wrapResponse({ ok: true }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
