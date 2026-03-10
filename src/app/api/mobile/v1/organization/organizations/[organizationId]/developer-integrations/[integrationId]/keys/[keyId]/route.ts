import { NextResponse } from "next/server";
import { RevokeDeveloperApiKeySchema } from "@/lib/modules/developer-integration/dtos/developer-integration.dto";
import { makeDeveloperIntegrationService } from "@/lib/modules/developer-integration/factories/developer-integration.factory";
import { applyDeveloperManagementDeprecationHeaders } from "@/lib/modules/developer-integration/http/deprecation";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
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

type Params = Promise<{
  organizationId: string;
  integrationId: string;
  keyId: string;
}>;

export async function DELETE(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { organizationId, integrationId, keyId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return applyDeveloperManagementDeprecationHeaders(rl.response);

    const input = validate(RevokeDeveloperApiKeySchema, {
      organizationId,
      integrationId,
      keyId,
    });

    const service = makeDeveloperIntegrationService();
    const result = await service.revokeApiKey(session.userId, input);

    return applyDeveloperManagementDeprecationHeaders(
      NextResponse.json<ApiResponse<typeof result>>(wrapResponse(result)),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return applyDeveloperManagementDeprecationHeaders(
      NextResponse.json<ApiErrorResponse>(body, { status }),
    );
  }
}
