import { NextResponse } from "next/server";

import { handleError } from "@/shared/infra/http/error-handler";
import { BadGatewayError, ValidationError } from "@/shared/kernel/errors";
import type { ApiErrorResponse, ApiResponse } from "@/shared/kernel/response";
import { wrapResponse } from "@/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NearbyPlace = {
  id: string;
  name: string;
};

type NearbyResponse = {
  places: NearbyPlace[];
};

const DEFAULT_RADIUS = 100;
const DEFAULT_MAX = 10;
const MAX_RESULTS = 20;

const isValidLatLng = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeMax = (value?: number): number => {
  if (!value || !Number.isFinite(value)) return DEFAULT_MAX;
  return Math.max(1, Math.min(MAX_RESULTS, Math.round(value)));
};

export async function POST(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    if (typeof body !== "object" || body === null) {
      throw new ValidationError("Invalid request payload");
    }

    const payload = body as Record<string, unknown>;
    const lat = parseNumber(payload.lat);
    const lng = parseNumber(payload.lng);
    const radius = parseNumber(payload.radius) ?? DEFAULT_RADIUS;
    const max = normalizeMax(parseNumber(payload.max));

    if (lat === undefined || lng === undefined || !isValidLatLng(lat, lng)) {
      throw new ValidationError("Invalid latitude/longitude", {
        lat: payload.lat,
        lng: payload.lng,
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ValidationError("Missing GOOGLE_MAPS_API_KEY");
    }

    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      key: apiKey,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`,
      { cache: "no-store" },
    );

    const json = (await response.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{ name?: string; place_id?: string }>;
    };

    if (!response.ok) {
      throw new BadGatewayError("Google Places request failed", {
        status: response.status,
        body: json,
      });
    }

    if (json.status && json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      throw new BadGatewayError("Google Places status error", {
        status: json.status,
        error: json.error_message,
      });
    }

    const places: NearbyPlace[] = (json.results ?? [])
      .map((result) => {
        if (!result.name || !result.place_id) return null;
        return { id: result.place_id, name: result.name };
      })
      .filter((place): place is NearbyPlace => Boolean(place))
      .slice(0, max);

    return NextResponse.json<ApiResponse<NearbyResponse>>(
      wrapResponse({ places }),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
