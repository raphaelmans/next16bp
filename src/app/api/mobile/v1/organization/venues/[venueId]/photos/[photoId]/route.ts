import { NextResponse } from "next/server";
import { RemovePlacePhotoSchema } from "@/lib/modules/place/dtos";
import { makePlaceManagementService } from "@/lib/modules/place/factories/place.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
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

type Params = Promise<{ venueId: string; photoId: string }>;

export async function DELETE(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId, photoId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(RemovePlacePhotoSchema, {
      placeId: venueId,
      photoId,
    });

    const service = makePlaceManagementService();
    await service.removePhoto(session.userId, input.placeId, input.photoId);
    await revalidatePublicPlaceDetailPaths({
      placeId: input.placeId,
      requestId,
    });

    return NextResponse.json<ApiResponse<{ success: true }>>(
      wrapResponse({ success: true }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
