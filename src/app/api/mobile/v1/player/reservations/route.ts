import { NextResponse } from "next/server";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
import {
  CreateReservationForCourtSchema,
  GetMyReservationsSchema,
} from "@/lib/modules/reservation/dtos";
import { makeReservationService } from "@/lib/modules/reservation/factories/reservation.factory";
import type { IReservationService } from "@/lib/modules/reservation/services/reservation.service";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import {
  getBooleanParam,
  getNumberParam,
  getStringParam,
  parseJson,
  parseSearchParams,
} from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GetMyReservationsMobileResponse = Awaited<
  ReturnType<IReservationService["getMyReservationsWithDetails"]>
>;
type CreateReservationMobileResponse = Awaited<
  ReturnType<IReservationService["createReservationForCourt"]>
>;

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

    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(session.userId);

    const input = validate(GetMyReservationsSchema, {
      status: getStringParam(query, "status"),
      upcoming: getBooleanParam(query, "upcoming"),
      dateFrom: getStringParam(query, "dateFrom"),
      dateTo: getStringParam(query, "dateTo"),
      limit: getNumberParam(query, "limit"),
      offset: getNumberParam(query, "offset"),
    });

    const service = makeReservationService();
    const result = await service.getMyReservationsWithDetails(
      profile.id,
      input,
    );

    return NextResponse.json<ApiResponse<GetMyReservationsMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);

    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(session.userId);

    const raw = await parseJson(req);
    const input = validate(
      CreateReservationForCourtSchema,
      raw as Record<string, unknown>,
    );

    const service = makeReservationService();
    const result = await service.createReservationForCourt(
      session.userId,
      profile.id,
      input,
    );

    return NextResponse.json<ApiResponse<CreateReservationMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
