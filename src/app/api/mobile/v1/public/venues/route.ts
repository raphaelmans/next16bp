import { NextResponse } from "next/server";
import { ListPlacesSchema } from "@/lib/modules/place/dtos";
import { makePlaceDiscoveryService } from "@/lib/modules/place/factories/place.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import {
  getBooleanParam,
  getCsvParam,
  getNumberParam,
  getStringParam,
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

    const input = validate(ListPlacesSchema, {
      q: getStringParam(query, "q"),
      province: getStringParam(query, "province"),
      city: getStringParam(query, "city"),
      lat: getNumberParam(query, "lat"),
      lng: getNumberParam(query, "lng"),
      sportId: getStringParam(query, "sportId"),
      amenities: getCsvParam(query, "amenities"),
      verificationTier: getStringParam(query, "verificationTier"),
      featuredOnly: getBooleanParam(query, "featuredOnly"),
      limit: getNumberParam(query, "limit"),
      offset: getNumberParam(query, "offset"),
    });

    const service = makePlaceDiscoveryService();
    const result = await service.listPlaceSummaries(input);

    return NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
