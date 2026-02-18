import { NextResponse } from "next/server";
import { CreateOrganizationSchema } from "@/lib/modules/organization/dtos";
import { makeOrganizationService } from "@/lib/modules/organization/factories/organization.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { parseJson } from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeDates<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const service = makeOrganizationService();
    const organizations = await service.getMyOrganizations(session.userId);

    return NextResponse.json<ApiResponse<unknown>>(
      wrapResponse(serializeDates(organizations)),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(CreateOrganizationSchema, raw);

    const service = makeOrganizationService();
    const result = await service.createOrganization(session.userId, input);

    return NextResponse.json<ApiResponse<unknown>>(
      wrapResponse(serializeDates(result)),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
