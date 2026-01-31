import { NextResponse } from "next/server";
import { makePlaceDiscoveryService } from "@/lib/modules/place/factories/place.factory";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
    const service = makePlaceDiscoveryService();
    const amenities = await service.listAmenities();
    return NextResponse.json<ApiResponse<string[]>>(wrapResponse(amenities));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
