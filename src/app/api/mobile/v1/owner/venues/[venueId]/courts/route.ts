import { NextResponse } from "next/server";
import {
  CreateCourtSchema,
  ListCourtsByPlaceSchema,
} from "@/lib/modules/court/dtos";
import { makeCourtManagementService } from "@/lib/modules/court/factories/court.factory";
import type { ICourtManagementService } from "@/lib/modules/court/services/court-management.service";
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

type Params = Promise<{ venueId: string }>;
type ListCourtsByPlaceMobileResponse = Awaited<
  ReturnType<ICourtManagementService["listCourtsByPlace"]>
>;
type CreateCourtMobileResponse = Awaited<
  ReturnType<ICourtManagementService["createCourt"]>
>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(ListCourtsByPlaceSchema, { placeId: venueId });
    const service = makeCourtManagementService();
    const courts = await service.listCourtsByPlace(session.userId, input);

    return NextResponse.json<ApiResponse<ListCourtsByPlaceMobileResponse>>(
      wrapResponse(courts),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(CreateCourtSchema, {
      ...(raw as Record<string, unknown>),
      placeId: venueId,
    });

    const service = makeCourtManagementService();
    const court = await service.createCourt(session.userId, input);

    return NextResponse.json<ApiResponse<CreateCourtMobileResponse>>(
      wrapResponse(court),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
