import { NextResponse } from "next/server";
import {
  RevokeMobilePushTokenSchema,
  UpsertMobilePushTokenSchema,
} from "@/lib/modules/mobile-push-token/dtos";
import { makeMobilePushTokenService } from "@/lib/modules/mobile-push-token/factories/mobile-push-token.factory";
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

export async function PUT(req: Request) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(
      UpsertMobilePushTokenSchema,
      raw as Record<string, unknown>,
    );

    const service = makeMobilePushTokenService();
    await service.upsertToken(session.userId, {
      token: input.expoPushToken,
      platform: input.platform,
    });

    return NextResponse.json<ApiResponse<{ expoPushToken: string }>>(
      wrapResponse({ expoPushToken: input.expoPushToken }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function DELETE(req: Request) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(
      RevokeMobilePushTokenSchema,
      raw as Record<string, unknown>,
    );

    const service = makeMobilePushTokenService();
    // Idempotent — no 404 if token not found
    await service.revokeToken(session.userId, {
      token: input.expoPushToken,
    });

    return NextResponse.json<ApiResponse<{ success: true }>>(
      wrapResponse({ success: true as const }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
