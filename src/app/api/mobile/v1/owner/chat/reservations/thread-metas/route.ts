import { NextResponse } from "next/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { makeReservationChatService } from "@/lib/modules/chat/factories/reservation-chat.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import {
  getBooleanParam,
  getCsvParam,
  parseSearchParams,
} from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

const ThreadMetasSchema = z.object({
  reservationIds: z.array(S.ids.generic).max(30).optional().default([]),
  reservationGroupIds: z.array(S.ids.generic).max(30).optional().default([]),
  includeArchived: z.boolean().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const query = parseSearchParams(req);

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const reservationIds =
      getCsvParam(query, "reservationIds") ?? query.getAll("reservationIds");
    const reservationGroupIds =
      getCsvParam(query, "reservationGroupIds") ??
      query.getAll("reservationGroupIds");
    const includeArchived = getBooleanParam(query, "includeArchived");

    const input = validate(ThreadMetasSchema, {
      reservationIds,
      reservationGroupIds,
      includeArchived,
    });

    const service = makeReservationChatService();
    const result = await service.getThreadMetas(session.userId, {
      reservationIds: input.reservationIds,
      reservationGroupIds: input.reservationGroupIds,
      includeArchived: input.includeArchived,
    });

    return NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
