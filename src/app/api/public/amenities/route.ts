import { NextResponse } from "next/server";
import { makePlaceDiscoveryService } from "@/modules/place/factories/place.factory";
import { handleError } from "@/shared/infra/http/error-handler";
import type { ApiErrorResponse, ApiResponse } from "@/shared/kernel/response";
import { wrapResponse } from "@/shared/utils/response";

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
