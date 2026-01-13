import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "google.com",
  "www.google.com",
]);
const MAX_REDIRECT_HOPS = 5;

type LocationSource = "marker" | "center";

interface GoogleLocResponse {
  inputUrl: string;
  resolvedUrl?: string;
  suggestedName?: string;
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
    throw new Error("URL host not allowed");
  }

  let current = inputUrl;

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop += 1) {
    const response = await fetchHeadOrGet(current);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return current;

      const next = new URL(location, current);
      if (!isAllowedUrl(next)) {
        throw new Error("Redirect target host not allowed");
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
  lat: number;
  lng: number;
  zoom: number;
}): string {
  const params = new URLSearchParams({
    key: args.key,
    center: `${args.lat},${args.lng}`,
    zoom: args.zoom.toString(),
  });

  return `https://www.google.com/maps/embed/v1/view?${params.toString()}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputUrlRaw =
    typeof body === "object" && body !== null && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

  if (typeof inputUrlRaw !== "string" || inputUrlRaw.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'url'" }, { status: 400 });
  }

  const inputUrlString = inputUrlRaw.trim();

  let inputUrl: URL;
  try {
    inputUrl = new URL(inputUrlString);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const response: GoogleLocResponse = {
    inputUrl: inputUrlString,
    warnings: [],
  };

  try {
    const resolved = await resolveGoogleMapsUrl(inputUrl);
    response.resolvedUrl = resolved.toString();
    response.suggestedName = parseSuggestedNameFromPathname(resolved.pathname);

    const parsed = parseLatLngZoom(resolved.toString());
    if (!parsed) {
      response.warnings.push("Could not parse coordinates from resolved URL");
      return NextResponse.json(response);
    }

    response.lat = parsed.lat;
    response.lng = parsed.lng;
    response.zoom = parsed.zoom;
    response.source = parsed.source;

    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    if (!embedKey) {
      response.warnings.push("Missing NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY");
      return NextResponse.json(response);
    }

    response.embedSrc = buildEmbedSrc({
      key: embedKey,
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
    });

    return NextResponse.json(response);
  } catch (error) {
    response.warnings.push(
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(response, { status: 400 });
  }
}
