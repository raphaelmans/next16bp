import { NextResponse } from "next/server";
import { SubmitPlaceVerificationSchema } from "@/lib/modules/place-verification/dtos";
import { makePlaceVerificationService } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { parseFormData } from "@/lib/shared/infra/http/parse";
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

    const formData = await parseFormData(req);
    formData.set("placeId", venueId);

    const documents = formData.getAll("documents");
    if (documents.length === 0) {
      formData.append(
        "documents",
        new File([], "mobile-verification-request.png", {
          type: "image/png",
        }),
      );
    }

    const input = validate(SubmitPlaceVerificationSchema, formData);

    const service = makePlaceVerificationService();
    await service.submitRequest(session.userId, input);
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
