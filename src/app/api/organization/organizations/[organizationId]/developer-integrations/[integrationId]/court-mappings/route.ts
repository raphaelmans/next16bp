import { NextResponse } from "next/server";
import { ListDeveloperCourtMappingsSchema } from "@/lib/modules/developer-integration/dtos/developer-integration.dto";
import { makeDeveloperIntegrationService } from "@/lib/modules/developer-integration/factories/developer-integration.factory";
import { requireApiSession } from "@/lib/shared/infra/auth/api-session";
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

type Params = Promise<{ organizationId: string; integrationId: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireApiSession();
    const { organizationId, integrationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(ListDeveloperCourtMappingsSchema, {
      organizationId,
      integrationId,
    });

    const service = makeDeveloperIntegrationService();
    const result = await service.listCourtMappings(session.userId, input);

    return NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
