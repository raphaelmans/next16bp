import { NextResponse } from "next/server";
import {
  DeleteOrganizationPaymentMethodSchema,
  UpdateOrganizationPaymentMethodSchema,
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

type Params = Promise<{ paymentMethodId: string }>;

export async function PATCH(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { paymentMethodId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const input = validate(UpdateOrganizationPaymentMethodSchema, {
      ...(raw as Record<string, unknown>),
      paymentMethodId,
    });

    const service = makeOrganizationPaymentService();
    const method = await service.updateMethod(session.userId, input);
    const data = { method };

    return NextResponse.json<ApiResponse<typeof data>>(wrapResponse(data));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function DELETE(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { paymentMethodId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(DeleteOrganizationPaymentMethodSchema, {
      paymentMethodId,
    });

    const service = makeOrganizationPaymentService();
    await service.deleteMethod(session.userId, input.paymentMethodId);

    return NextResponse.json<ApiResponse<{ success: true }>>(
      wrapResponse({ success: true }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
