import { NextResponse } from "next/server";
import {
  CreateOrganizationPaymentMethodSchema,
  ListOrganizationPaymentMethodsSchema,
} from "@/lib/modules/organization-payment/dtos";
import { makeOrganizationPaymentService } from "@/lib/modules/organization-payment/factories/organization-payment.factory";
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

type Params = Promise<{ organizationId: string }>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { organizationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(ListOrganizationPaymentMethodsSchema, {
      organizationId,
    });
    const service = makeOrganizationPaymentService();
    const methods = await service.listMethods(
      session.userId,
      input.organizationId,
    );

    return NextResponse.json<ApiResponse<{ methods: unknown }>>(
      wrapResponse({ methods }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { organizationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(CreateOrganizationPaymentMethodSchema, {
      ...(raw as Record<string, unknown>),
      organizationId,
    });

    const service = makeOrganizationPaymentService();
    const method = await service.createMethod(session.userId, input);

    return NextResponse.json<ApiResponse<{ method: unknown }>>(
      wrapResponse({ method }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
