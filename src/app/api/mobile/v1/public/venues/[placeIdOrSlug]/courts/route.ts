import { NextResponse } from "next/server";
import { GetPlaceByIdOrSlugSchema } from "@/lib/modules/place/dtos";
import { makePlaceDiscoveryService } from "@/lib/modules/place/factories/place.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ placeIdOrSlug: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const { placeIdOrSlug } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetPlaceByIdOrSlugSchema, { placeIdOrSlug });
    const service = makePlaceDiscoveryService();
    const placeDetails = await service.getPlaceByIdOrSlug(input.placeIdOrSlug);

    return NextResponse.json<ApiResponse<unknown>>(
      wrapResponse(placeDetails.courts),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
