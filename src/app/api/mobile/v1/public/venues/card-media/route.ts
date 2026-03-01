import { NextResponse } from "next/server";
import { ListPlaceCardMediaSchema } from "@/lib/modules/place/dtos";
import { makePlaceDiscoveryService } from "@/lib/modules/place/factories/place.factory";
import type { PlaceCardMediaItem } from "@/lib/modules/place/repositories/place.repository";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getCsvParam, parseSearchParams } from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
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
    const query = parseSearchParams(req);
    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(ListPlaceCardMediaSchema, {
      placeIds: getCsvParam(query, "placeIds"),
    });

    const service = makePlaceDiscoveryService();
    const result = await service.listPlaceCardMediaByIds(input.placeIds);

    return NextResponse.json<ApiResponse<PlaceCardMediaItem[]>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
