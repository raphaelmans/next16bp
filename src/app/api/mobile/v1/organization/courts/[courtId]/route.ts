import { NextResponse } from "next/server";
import {
  GetCourtByIdSchema,
  UpdateCourtSchema,
} from "@/lib/modules/court/dtos";
import { makeCourtManagementService } from "@/lib/modules/court/factories/court.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
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

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { courtId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetCourtByIdSchema, { courtId });
    const service = makeCourtManagementService();
    const court = await service.getCourtById(session.userId, input.courtId);

    return NextResponse.json<ApiResponse<typeof court>>(wrapResponse(court));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
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
    const input = validate(UpdateCourtSchema, {
      ...(raw as Record<string, unknown>),
      courtId,
    });

    const service = makeCourtManagementService();
    const court = await service.updateCourt(session.userId, input);
    if (court.placeId) {
      await revalidatePublicPlaceDetailPaths({
        placeId: court.placeId,
        requestId,
      });
    }

    return NextResponse.json<ApiResponse<typeof court>>(wrapResponse(court));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
