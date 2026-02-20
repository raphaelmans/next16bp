import { NextResponse } from "next/server";
import { UploadPaymentProofSchema } from "@/lib/modules/payment-proof/dtos/upload-payment-proof.dto";
import { makePaymentProofService } from "@/lib/modules/payment-proof/factories/payment-proof.factory";
import type { IPaymentProofService } from "@/lib/modules/payment-proof/services/payment-proof.service";
import { requireMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { parseFormData } from "@/lib/shared/infra/http/parse";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ reservationId: string }>;
type UploadPaymentProofMobileResponse = Awaited<
  ReturnType<IPaymentProofService["uploadPaymentProof"]>
>;

export async function POST(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);

  try {
    const session = await requireMobileSession(req);
    const { reservationId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const formData = await parseFormData(req);
    formData.set("reservationId", reservationId);

    const input = UploadPaymentProofSchema.parse(formData);

    const service = makePaymentProofService();
    const result = await service.uploadPaymentProof(
      session.userId,
      input.reservationId,
      input.image,
      input.referenceNumber,
      input.notes,
    );

    return NextResponse.json<ApiResponse<UploadPaymentProofMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
