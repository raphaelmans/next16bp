"use client";

import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const DEFAULT_ZOOM = 15;

interface GoogleMapsEmbedProps {
  title: string;
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  zoom?: number;
  className?: string;
  iframeClassName?: string;
  allowInteraction?: boolean;
}

export function GoogleMapsEmbed({
  title,
  lat,
  lng,
  query,
  zoom = DEFAULT_ZOOM,
  className,
  iframeClassName,
  allowInteraction = true,
}: GoogleMapsEmbedProps) {
  const embedKey = env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const hasEmbedKey = Boolean(embedKey);
  const hasCoordinates =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);
  const normalizedQuery = query?.trim() ?? "";

  let embedSrc: string | null = null;

  if (hasEmbedKey) {
    if (hasCoordinates) {
      const params = new URLSearchParams({
        key: embedKey ?? "",
        center: `${lat},${lng}`,
        zoom: zoom.toString(),
        maptype: "roadmap",
      });
      embedSrc = `https://www.google.com/maps/embed/v1/view?${params.toString()}`;
    } else if (normalizedQuery.length > 0) {
      const params = new URLSearchParams({
        key: embedKey ?? "",
        q: normalizedQuery,
      });
      embedSrc = `https://www.google.com/maps/embed/v1/search?${params.toString()}`;
    }
  }

  const fallbackTitle = hasEmbedKey
    ? "Map preview unavailable"
    : "Map preview disabled";
  const fallbackDescription = hasEmbedKey
    ? "Location data is unavailable."
    : "Set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable embeds.";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-muted",
        className,
      )}
    >
      {embedSrc ? (
        <iframe
          title={title}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className={cn(
            "h-full w-full border-0",
            !allowInteraction && "pointer-events-none",
            iframeClassName,
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground/80">{fallbackTitle}</p>
            <p>{fallbackDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
