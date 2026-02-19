import { NextResponse } from "next/server";
import {
  DeletePlaceSchema,
  GetPlaceByIdSchema,
  UpdatePlaceSchema,
} from "@/lib/modules/place/dtos";
import { makePlaceManagementService } from "@/lib/modules/place/factories/place.factory";
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

type Params = Promise<{ venueId: string }>;

const normalizeMobilePlaceInput = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = { ...raw };

  if (normalized.name === undefined && normalized.placeName !== undefined) {
    normalized.name = normalized.placeName;
  }

  if (
    normalized.address === undefined &&
    normalized.streetAddress !== undefined
  ) {
    normalized.address = normalized.streetAddress;
  }

  if (normalized.province === undefined && normalized.state !== undefined) {
    normalized.province = normalized.state;
  }

  if (normalized.timeZone === undefined && normalized.timezone !== undefined) {
    normalized.timeZone = normalized.timezone;
  }

  return normalized;
};

export async function GET(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "default",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(GetPlaceByIdSchema, { placeId: venueId });
    const service = makePlaceManagementService();
    const place = await service.getPlaceById(session.userId, input.placeId);

    return NextResponse.json<ApiResponse<typeof place>>(wrapResponse(place));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const raw = await parseJson(req);
    const normalizedRaw = normalizeMobilePlaceInput(
      raw as Record<string, unknown>,
    );
    const input = validate(UpdatePlaceSchema, {
      ...normalizedRaw,
      placeId: venueId,
    });

    const service = makePlaceManagementService();
    const place = await service.updatePlace(session.userId, input);

    return NextResponse.json<ApiResponse<typeof place>>(wrapResponse(place));
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}

export async function DELETE(req: Request, context: { params: Params }) {
  const requestId = getRequestId(req);
  try {
    const session = await requireMobileSession(req);
    const { venueId } = await context.params;

    const rl = await enforceRateLimit({
      req,
      tier: "mutation",
      requestId,
      identifier: session.userId,
    });
    if (!rl.ok) return rl.response;

    const input = validate(DeletePlaceSchema, { placeId: venueId });
    const service = makePlaceManagementService();
    await service.deletePlace(session.userId, input.placeId);

    return NextResponse.json<ApiResponse<{ success: true }>>(
      wrapResponse({ success: true }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
