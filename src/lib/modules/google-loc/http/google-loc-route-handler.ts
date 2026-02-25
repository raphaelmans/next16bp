import { NextResponse } from "next/server";
import { getMobileSession } from "@/lib/shared/infra/auth/mobile-session";
import { getServerSession } from "@/lib/shared/infra/auth/server-session";
import { handleError } from "@/lib/shared/infra/http/error-handler";
import { enforceRateLimit } from "@/lib/shared/infra/http/http-rate-limit";
import { getRequestId } from "@/lib/shared/infra/http/request-id";
import { validate } from "@/lib/shared/infra/http/validate";
import type { Session } from "@/lib/shared/kernel/auth";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/shared/kernel/errors";
import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";
import { wrapResponse } from "@/lib/shared/utils/response";
import {
  GoogleLocNearbyRequestSchema,
  type GoogleLocNearbyResponse,
  GoogleLocPreviewRequestSchema,
  type GoogleLocPreviewResponse,
} from "../dtos";
import { makeGoogleLocService } from "../factories/google-loc.factory";

const ALLOWED_ROLES = new Set<Session["role"]>(["admin", "member"]);

const DEPRECATION_HEADERS = {
  Deprecation: "true",
  Sunset: "Thu, 30 Apr 2026 00:00:00 GMT",
  Link: '</api/v1/google-loc/openapi.json>; rel="describedby"',
} as const;

type HandlerOptions = {
  deprecatedAlias?: boolean;
};

function assertGoogleLocSession(
  session: Session | null,
  requestId: string,
): Session {
  if (!session || !session.userId) {
    throw new AuthenticationError("Authentication required");
  }

  if (!ALLOWED_ROLES.has(session.role)) {
    throw new AuthorizationError("Admin or owner access required", {
      requestId,
      role: session.role,
    });
  }

  return session;
}

async function resolveGoogleLocSession(
  req: Request,
  requestId: string,
): Promise<Session> {
  const mobileSession = await getMobileSession(req);
  if (mobileSession) {
    return assertGoogleLocSession(mobileSession, requestId);
  }

  const browserSession = await getServerSession();
  return assertGoogleLocSession(browserSession, requestId);
}

async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

function applyDeprecationHeaders(res: NextResponse) {
  for (const [key, value] of Object.entries(DEPRECATION_HEADERS)) {
    res.headers.set(key, value);
  }
}

export async function handleGoogleLocPreview(
  req: Request,
  options?: HandlerOptions,
) {
  const requestId = getRequestId(req);
  try {
    const session = await resolveGoogleLocSession(req, requestId);
    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const body = validate(
      GoogleLocPreviewRequestSchema,
      await parseJsonBody(req),
    );
    const service = makeGoogleLocService();
    const result = await service.preview(body);

    const response = NextResponse.json<ApiResponse<GoogleLocPreviewResponse>>(
      wrapResponse(result),
    );
    if (options?.deprecatedAlias) applyDeprecationHeaders(response);

    return response;
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function handleGoogleLocNearby(
  req: Request,
  options?: HandlerOptions,
) {
  const requestId = getRequestId(req);
  try {
    const session = await resolveGoogleLocSession(req, requestId);
    const rl = await enforceRateLimit({
      req,
      tier: "sensitive",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const body = validate(
      GoogleLocNearbyRequestSchema,
      await parseJsonBody(req),
    );
    const service = makeGoogleLocService();
    const result = await service.nearby(body);

    const response = NextResponse.json<ApiResponse<GoogleLocNearbyResponse>>(
      wrapResponse(result),
    );
    if (options?.deprecatedAlias) applyDeprecationHeaders(response);

    return response;
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
