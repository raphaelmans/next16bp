import { NextResponse } from "next/server";
import { AcceptReservationSchema } from "@/lib/modules/reservation/dtos";
import { makeReservationOwnerService } from "@/lib/modules/reservation/factories/reservation.factory";
import type { IReservationOwnerService } from "@/lib/modules/reservation/services/reservation-owner.service";
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

type Params = Promise<{ reservationId: string }>;
type AcceptReservationMobileResponse = Awaited<
  ReturnType<IReservationOwnerService["acceptReservation"]>
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

    const input = validate(AcceptReservationSchema, { reservationId });
    const service = makeReservationOwnerService();
    const result = await service.acceptReservation(
      session.userId,
      input.reservationId,
    );

    return NextResponse.json<ApiResponse<AcceptReservationMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
