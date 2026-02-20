import { NextResponse } from "next/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { makeReservationService } from "@/lib/modules/reservation/factories/reservation.factory";
import type { IReservationService } from "@/lib/modules/reservation/services/reservation.service";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
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

const ReservationIdSchema = z.object({ reservationId: S.ids.generic });

type Params = Promise<{ reservationId: string }>;
type PaymentInfoMobileResponse = Awaited<
  ReturnType<IReservationService["getPaymentInfo"]>
>;

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { reservationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(session.userId);

    const input = validate(ReservationIdSchema, { reservationId });
    const service = makeReservationService();
    const result = await service.getPaymentInfo(
      session.userId,
      profile.id,
      input.reservationId,
    );

    return NextResponse.json<ApiResponse<PaymentInfoMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
