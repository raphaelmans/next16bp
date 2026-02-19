import { NextResponse } from "next/server";
import { ConfirmPaymentSchema } from "@/lib/modules/reservation/dtos";
import { makeReservationOwnerService } from "@/lib/modules/reservation/factories/reservation.factory";
import type { IReservationOwnerService } from "@/lib/modules/reservation/services/reservation-owner.service";
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
type ConfirmPaymentMobileResponse = Awaited<
  ReturnType<IReservationOwnerService["confirmPayment"]>
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

    const raw = await parseJson(req);
    const input = validate(ConfirmPaymentSchema, {
      ...(raw as Record<string, unknown>),
      reservationId,
    });

    const service = makeReservationOwnerService();
    const result = await service.confirmPayment(session.userId, input);

    return NextResponse.json<ApiResponse<ConfirmPaymentMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
