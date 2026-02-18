import { NextResponse } from "next/server";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { createMobileV1OpenApiDocument } from "@/lib/shared/infra/openapi/mobile-v1.document";
import type { ApiErrorResponse } from "@/lib/shared/kernel/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  try {
    const url = new URL(req.url);
    const baseUrl = url.origin;
    const document = createMobileV1OpenApiDocument({
      baseUrl,
      basePath: "/api/v1",
    });
    return NextResponse.json(document);
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
