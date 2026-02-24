import { NextResponse } from "next/server";
import { ListPlaceCardMetaSchema } from "@/lib/modules/place/dtos";
import { makePlaceDiscoveryService } from "@/lib/modules/place/factories/place.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import {
  getCsvParam,
  getStringParam,
  parseSearchParams,
} from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  PlaceCardMetaItem,
} from "@/lib/modules/place/repositories/place.repository";
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

    const input = validate(ListPlaceCardMetaSchema, {
      placeIds: getCsvParam(query, "placeIds"),
      sportId: getStringParam(query, "sportId"),
    });

    const service = makePlaceDiscoveryService();
    const result = await service.listPlaceCardMetaByIds(
      input.placeIds,
      input.sportId,
    );

    return NextResponse.json<ApiResponse<PlaceCardMetaItem[]>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
