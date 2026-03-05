import { BadGatewayError, ValidationError } from "@/lib/shared/kernel/errors";
import { resolveGooglePlaceId } from "@/lib/shared/lib/google-maps/resolve-google-place-id";
import type {
  GoogleLocGeocodeRequest,
  GoogleLocGeocodeResponse,
  GoogleLocNearbyRequest,
  GoogleLocNearbyResponse,
  GoogleLocPreviewRequest,
  GoogleLocPreviewResponse,
} from "../dtos";

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "google.com",
  "www.google.com",
]);
const MAX_REDIRECT_HOPS = 5;

const DEFAULT_RADIUS = 100;
const DEFAULT_MAX = 10;
const MAX_RESULTS = 20;

type LocationSource = "marker" | "center";

function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.has(url.hostname);
}

function parseSuggestedNameFromPathname(pathname: string): string | undefined {
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
  const markerMatch = href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
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

function normalizeMax(value?: number): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_MAX;
  return Math.max(1, Math.min(MAX_RESULTS, Math.round(value)));
}

export interface IGoogleLocService {
  preview(args: GoogleLocPreviewRequest): Promise<GoogleLocPreviewResponse>;
  nearby(args: GoogleLocNearbyRequest): Promise<GoogleLocNearbyResponse>;
}

export class GoogleLocService implements IGoogleLocService {
  async preview(
    args: GoogleLocPreviewRequest,
  ): Promise<GoogleLocPreviewResponse> {
    let inputUrl: URL;
    try {
      inputUrl = new URL(args.url);
    } catch {
      throw new ValidationError("Invalid URL");
    }

    const response: GoogleLocPreviewResponse = {
      inputUrl: args.url,
      warnings: [],
    };

    const resolved = await resolveGoogleMapsUrl(inputUrl);
    response.resolvedUrl = resolved.toString();
    response.suggestedName = parseSuggestedNameFromPathname(resolved.pathname);

    response.placeId = parsePlaceIdFromUrl(resolved);

    const parsed = parseLatLngZoom(resolved.toString());
    if (!parsed) {
      response.warnings.push("Could not parse coordinates from resolved URL");
      return response;
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
        const resolvedPlace = await resolveGooglePlaceId({
          apiKey,
          name: response.suggestedName,
          lat: parsed.lat,
          lng: parsed.lng,
        });

        if (resolvedPlace.placeId) {
          response.placeId = resolvedPlace.placeId;
        } else {
          response.warnings.push("Could not resolve placeId from name");
        }
      }
    }

    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    if (!embedKey) {
      response.warnings.push("Missing NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY");
      return response;
    }

    response.embedSrc = buildEmbedSrc({
      key: embedKey,
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
      placeId: response.placeId,
    });

    return response;
  }

  async nearby(args: GoogleLocNearbyRequest): Promise<GoogleLocNearbyResponse> {
    if (!isValidLatLng(args.lat, args.lng)) {
      throw new ValidationError("Invalid latitude/longitude", {
        lat: args.lat,
        lng: args.lng,
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ValidationError("Missing GOOGLE_MAPS_API_KEY");
    }

    const radius = args.radius ?? DEFAULT_RADIUS;
    const max = normalizeMax(args.max);

    const params = new URLSearchParams({
      location: `${args.lat},${args.lng}`,
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

    const places = (json.results ?? [])
      .map((result) => {
        if (!result.name || !result.place_id) return null;
        return { id: result.place_id, name: result.name };
      })
      .filter((place): place is { id: string; name: string } => Boolean(place))
      .slice(0, max);

    return { places };
  }

  async geocode(
    args: GoogleLocGeocodeRequest,
  ): Promise<GoogleLocGeocodeResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new ValidationError("Missing GOOGLE_MAPS_API_KEY");
    }

    const params = new URLSearchParams({
      address: args.address,
      region: "ph",
      components: "country:PH",
      key: apiKey,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      { cache: "no-store" },
    );

    const json = (await response.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{
        geometry?: { location?: { lat: number; lng: number } };
        formatted_address?: string;
      }>;
    };

    if (!response.ok) {
      throw new BadGatewayError("Google Geocoding request failed", {
        status: response.status,
        body: json,
      });
    }

    if (json.status === "ZERO_RESULTS" || (json.results?.length ?? 0) === 0) {
      throw new ValidationError("No results found for that address");
    }

    if (json.status && json.status !== "OK") {
      throw new BadGatewayError("Google Geocoding status error", {
        status: json.status,
        error: json.error_message,
      });
    }

    const results = (json.results ?? [])
      .filter((r) => r.geometry?.location)
      .slice(0, 5)
      .map((r) => ({
        lat: r.geometry!.location!.lat,
        lng: r.geometry!.location!.lng,
        formattedAddress: r.formatted_address ?? "Unknown address",
      }));

    if (results.length === 0) {
      throw new ValidationError("No results found for that address");
    }

    return { results };
  }
}
