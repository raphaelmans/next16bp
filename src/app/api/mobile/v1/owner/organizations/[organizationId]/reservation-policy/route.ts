import { NextResponse } from "next/server";
import { z } from "zod";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makeOrganizationReservationPolicyRepository } from "@/lib/modules/organization-payment/factories/organization-payment.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { parseJson } from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import { AuthorizationError, NotFoundError } from "@/lib/shared/kernel/errors";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ organizationId: string }>;

const UpdateReservationPolicySchema = z.object({
  requiresOwnerConfirmation: z.boolean().optional(),
  paymentHoldMinutes: z.number().int().min(0).optional(),
  ownerReviewMinutes: z.number().int().min(0).optional(),
  cancellationCutoffMinutes: z.number().int().min(0).optional(),
});

async function assertOrgOwner(userId: string, organizationId: string) {
  const organization =
    await makeOrganizationRepository().findById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization not found", { organizationId });
  }
  if (organization.ownerUserId !== userId) {
    throw new AuthorizationError("You are not the owner of this organization", {
      organizationId,
    });
  }
}

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

    await assertOrgOwner(session.userId, organizationId);

    const repository = makeOrganizationReservationPolicyRepository();
    const policy = await repository.ensureForOrganization(organizationId);

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(policy));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
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

    await assertOrgOwner(session.userId, organizationId);

    const raw = await parseJson(req);
    const input = validate(UpdateReservationPolicySchema, raw);

    const repository = makeOrganizationReservationPolicyRepository();
    const current = await repository.ensureForOrganization(organizationId);
    const updated = await repository.update(current.id, input);

    return NextResponse.json<ApiResponse<unknown>>(wrapResponse(updated));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
