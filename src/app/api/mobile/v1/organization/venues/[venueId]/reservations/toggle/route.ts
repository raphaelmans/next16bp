import { NextResponse } from "next/server";
import { TogglePlaceReservationsSchema } from "@/lib/modules/place-verification/dtos";
import { makePlaceVerificationService } from "@/lib/modules/place-verification/factories/place-verification.factory";
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

type Params = Promise<{ venueId: string }>;
type TogglePlaceReservationsMobileResponse = { success: true };

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
    const input = validate(TogglePlaceReservationsSchema, {
      ...(raw as Record<string, unknown>),
      placeId: venueId,
    });

    const service = makePlaceVerificationService();
    await service.toggleReservations(session.userId, input);
    await revalidatePublicPlaceDetailPaths({
      placeId: input.placeId,
      requestId,
    });

    return NextResponse.json<
      ApiResponse<TogglePlaceReservationsMobileResponse>
    >(wrapResponse({ success: true }));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
