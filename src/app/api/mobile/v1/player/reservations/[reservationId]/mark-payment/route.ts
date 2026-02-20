import { NextResponse } from "next/server";
import { MarkPaymentSchema } from "@/lib/modules/reservation/dtos";
import { makeReservationService } from "@/lib/modules/reservation/factories/reservation.factory";
import type { IReservationService } from "@/lib/modules/reservation/services/reservation.service";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
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

type Params = Promise<{ reservationId: string }>;
type MarkPaymentMobileResponse = Awaited<
  ReturnType<IReservationService["markPayment"]>
>;

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { reservationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(session.userId);

    const raw = await parseJson(req);
    const input = validate(MarkPaymentSchema, {
      ...(raw as Record<string, unknown>),
      reservationId,
    });

    const service = makeReservationService();
    const result = await service.markPayment(
      session.userId,
      profile.id,
      input,
    );

    return NextResponse.json<ApiResponse<MarkPaymentMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
