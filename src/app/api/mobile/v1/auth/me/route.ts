import { NextResponse } from "next/server";
import { z } from "zod";
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

const AuthMeDataSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(["admin", "member", "viewer"]),
});

type AuthMeData = z.infer<typeof AuthMeDataSchema>;

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

    const data: AuthMeData = AuthMeDataSchema.parse({
      id: session.userId,
      email: session.email,
      role: session.role,
    });

    return NextResponse.json<ApiResponse<AuthMeData>>(wrapResponse(data));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
