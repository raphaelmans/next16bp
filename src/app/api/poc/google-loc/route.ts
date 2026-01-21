import { NextResponse } from "next/server";
import { handleError } from "@/shared/infra/http/error-handler";
import { ValidationError } from "@/shared/kernel/errors";
import type { ApiErrorResponse, ApiResponse } from "@/shared/kernel/response";
import { resolveGooglePlaceId } from "@/shared/lib/google-maps/resolve-google-place-id";
import { wrapResponse } from "@/shared/utils/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "google.com",
  "www.google.com",
]);
const MAX_REDIRECT_HOPS = 5;

type LocationSource = "marker" | "center";

export interface GoogleLocResponse {
  inputUrl: string;
  resolvedUrl?: string;
  suggestedName?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  source?: LocationSource;
  embedSrc?: string;
  warnings: string[];
}

function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.has(url.hostname);
}

function parseSuggestedNameFromPathname(pathname: string): string | undefined {
  // Example:
  // /maps/place/Net+and+Paddle+Pickleball+Club/@10.29,123.88,17z/...
  const placePrefix = "/maps/place/";
  const startIndex = pathname.indexOf(placePrefix);
  if (startIndex === -1) return undefined;

  const afterPrefix = pathname.slice(startIndex + placePrefix.length);
  const firstSegment = afterPrefix.split("/")[0];
  if (!firstSegment) return undefined;

  try {
    return decodeURIComponent(firstSegment.replaceAll("+", " "));
  } catch {
    return firstSegment.replaceAll("+", " ");
  }
}

function parsePlaceIdFromUrl(url: URL): string | undefined {
  const directParams = [
    "query_place_id",
    "destination_place_id",
    "origin_place_id",
    "place_id",
  ];

  for (const key of directParams) {
    const value = url.searchParams.get(key);
    if (value && value.trim().length > 0) return value.trim();
  }

  const q = url.searchParams.get("q");
  if (q?.includes("place_id:")) {
    const maybe = q.split("place_id:")[1]?.trim();
    if (maybe) return maybe;
  }

  const href = url.toString();
  const match = href.match(/place_id:([^&]+)/);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  const dataMatch = href.match(/!1s([^!]+)/);
  if (dataMatch?.[1]?.startsWith("ChI")) {
    try {
      return decodeURIComponent(dataMatch[1]);
    } catch {
      return dataMatch[1];
    }
  }

  return undefined;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 17;
  return Math.max(0, Math.min(21, Math.round(zoom)));
}

function parseLatLngZoom(
  href: string,
):
  | { lat: number; lng: number; zoom: number; source: LocationSource }
  | undefined {
  // Marker coordinates (often the actual place pin)
  const markerMatch = href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

  // Center/viewport coordinates
  const centerMatch = href.match(
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)z/,
  );

  const centerZoom = centerMatch
    ? clampZoom(Number.parseFloat(centerMatch[3]))
    : 17;

  if (markerMatch) {
    const lat = Number.parseFloat(markerMatch[1]);
    const lng = Number.parseFloat(markerMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng, zoom: centerZoom, source: "marker" };
    }
  }

  if (centerMatch) {
    const lat = Number.parseFloat(centerMatch[1]);
    const lng = Number.parseFloat(centerMatch[2]);
    const zoom = clampZoom(Number.parseFloat(centerMatch[3]));
    if (isValidLatLng(lat, lng)) {
      return { lat, lng, zoom, source: "center" };
    }
  }

  return undefined;
}

async function fetchHeadOrGet(url: URL): Promise<Response> {
  const head = await fetch(url, {
    method: "HEAD",
    redirect: "manual",
    cache: "no-store",
  });

  if (head.status === 405 || head.status === 501) {
    return fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
  }

  return head;
}

async function resolveGoogleMapsUrl(inputUrl: URL): Promise<URL> {
  if (!isAllowedUrl(inputUrl)) {
    throw new ValidationError("URL host not allowed", {
      host: inputUrl.hostname,
    });
  }

  let current = inputUrl;

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop += 1) {
    const response = await fetchHeadOrGet(current);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return current;

      const next = new URL(location, current);
      if (!isAllowedUrl(next)) {
        throw new ValidationError("Redirect target host not allowed", {
          host: next.hostname,
        });
      }

      current = next;
      continue;
    }

    return current;
  }

  return current;
}

function buildEmbedSrc(args: {
  key: string;
  placeId?: string;
  lat: number;
  lng: number;
  zoom: number;
}): string {
  if (args.placeId) {
    const params = new URLSearchParams({
      key: args.key,
      q: `place_id:${args.placeId}`,
    });
    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  const params = new URLSearchParams({
    key: args.key,
    center: `${args.lat},${args.lng}`,
    zoom: args.zoom.toString(),
  });

  return `https://www.google.com/maps/embed/v1/view?${params.toString()}`;
}

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

    const inputUrlRaw =
      typeof body === "object" && body !== null && "url" in body
        ? (body as { url?: unknown }).url
        : undefined;

    if (typeof inputUrlRaw !== "string" || inputUrlRaw.trim().length === 0) {
      throw new ValidationError("Missing 'url'");
    }

    const inputUrlString = inputUrlRaw.trim();

    let inputUrl: URL;
    try {
      inputUrl = new URL(inputUrlString);
    } catch {
      throw new ValidationError("Invalid URL");
    }

    const response: GoogleLocResponse = {
      inputUrl: inputUrlString,
      warnings: [],
    };

    const resolved = await resolveGoogleMapsUrl(inputUrl);
    response.resolvedUrl = resolved.toString();
    response.suggestedName = parseSuggestedNameFromPathname(resolved.pathname);

    response.placeId = parsePlaceIdFromUrl(resolved);

    const parsed = parseLatLngZoom(resolved.toString());
    if (!parsed) {
      response.warnings.push("Could not parse coordinates from resolved URL");
      return NextResponse.json<ApiResponse<GoogleLocResponse>>(
        wrapResponse(response),
      );
    }

    response.lat = parsed.lat;
    response.lng = parsed.lng;
    response.zoom = parsed.zoom;
    response.source = parsed.source;

    if (!response.placeId) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        response.warnings.push("Missing GOOGLE_MAPS_API_KEY");
      } else if (response.suggestedName) {
        const resolved = await resolveGooglePlaceId({
          apiKey,
          name: response.suggestedName,
          lat: parsed.lat,
          lng: parsed.lng,
        });
        if (resolved.placeId) {
          response.placeId = resolved.placeId;
        } else {
          response.warnings.push("Could not resolve placeId from name");
        }
      }
    }

    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    if (!embedKey) {
      response.warnings.push("Missing NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY");
      return NextResponse.json<ApiResponse<GoogleLocResponse>>(
        wrapResponse(response),
      );
    }

    response.embedSrc = buildEmbedSrc({
      key: embedKey,
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
      placeId: response.placeId,
    });

    return NextResponse.json<ApiResponse<GoogleLocResponse>>(
      wrapResponse(response),
    );
  } catch (error) {
    const { status, body } = handleError(error, requestId);
    return NextResponse.json<ApiErrorResponse>(body, { status });
  }
}
