import { NextResponse } from "next/server";
import { z } from "zod";
import { makeOwnerSetupStatusUseCase } from "@/lib/modules/owner-setup/factories/owner-setup.factory";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OwnerSetupStatusSchema = z.object({
  hasOrganization: z.boolean(),
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  hasPendingClaim: z.boolean(),
  hasVenue: z.boolean(),
  hasAnyConfiguredVenue: z.boolean(),
  primaryPlace: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  verificationStatus: z
    .enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"])
    .nullable(),
  hasVerification: z.boolean(),
  hasActiveCourt: z.boolean(),
  hasReadyCourt: z.boolean(),
  hasCourtSchedule: z.boolean(),
  hasCourtPricing: z.boolean(),
  primaryCourtId: z.string().nullable(),
  readyCourtId: z.string().nullable(),
  isSetupComplete: z.boolean(),
  nextStep: z.enum([
    "create_organization",
    "add_or_claim_venue",
    "claim_pending",
    "verify_venue",
    "configure_courts",
    "complete",
  ]),
});

type OwnerSetupStatus = z.infer<typeof OwnerSetupStatusSchema>;

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
    if (!rl.ok) {
      return rl.response;
    }

    const useCase = makeOwnerSetupStatusUseCase();
    const result = await useCase.execute(session.userId);
    const data: OwnerSetupStatus = OwnerSetupStatusSchema.parse(result);

    return NextResponse.json<ApiResponse<OwnerSetupStatus>>(wrapResponse(data));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
