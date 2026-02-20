import { NextResponse } from "next/server";
import { UpdateProfileSchema } from "@/lib/modules/profile/dtos";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
import type { IProfileService } from "@/lib/modules/profile/services/profile.service";
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

type GetProfileMobileResponse = Awaited<
  ReturnType<IProfileService["getOrCreateProfile"]>
>;
type UpdateProfileMobileResponse = Awaited<
  ReturnType<IProfileService["updateProfile"]>
>;

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

    const service = makeProfileService();
    const result = await service.getOrCreateProfile(session.userId);

    return NextResponse.json<ApiResponse<GetProfileMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function PATCH(req: Request) {
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
    const input = validate(
      UpdateProfileSchema,
      raw as Record<string, unknown>,
    );

    const service = makeProfileService();
    const result = await service.updateProfile(session.userId, input);

    return NextResponse.json<ApiResponse<UpdateProfileMobileResponse>>(
      wrapResponse(result),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
