import type { DeveloperApiKeyScope } from "@/lib/modules/developer-integration/dtos/developer-integration.dto";
import { makeDeveloperIntegrationService } from "@/lib/modules/developer-integration/factories/developer-integration.factory";
import type { DeveloperApiAuthContext } from "@/lib/modules/developer-integration/services/developer-integration.service";
import { getClientIp } from "@/lib/shared/infra/http/client-identifier";

export async function requireDeveloperApiKey(
  req: Request,
  requiredScopes: DeveloperApiKeyScope[],
): Promise<DeveloperApiAuthContext> {
  const rawKey = req.headers.get("x-api-key");
  const service = makeDeveloperIntegrationService();
  const auth = await service.authenticateApiKey(rawKey ?? "", getClientIp(req));
  service.assertApiKeyScopes(auth, requiredScopes);
  return auth;
}
