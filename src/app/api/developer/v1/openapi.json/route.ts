import { NextResponse } from "next/server";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { createDeveloperV1OpenApiDocument } from "@/lib/shared/infra/openapi/developer-v1.document";
import type { ApiErrorResponse } from "@/lib/shared/kernel/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = getRequestId(req);

  try {
    const url = new URL(req.url);
    const document = createDeveloperV1OpenApiDocument({
      baseUrl: url.origin,
      basePath: "/api/developer/v1",
    });

    return NextResponse.json(document);
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
