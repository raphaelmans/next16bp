import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";
import { isUuid } from "@/lib/slug";
import CourtDetailClient from "./court-detail-client";

type PageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("http") ? value : new URL(value, appUrl).toString();
};

const buildLocationLabel = (place: {
  city: string;
  province: string;
  address: string;
}) => {
  const parts = [place.city, place.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : place.address;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { placeId, courtId } = await params;

  let title = "Court details";
  let description = "View court details on KudosCourts.";
  let canonicalPath = appRoutes.places.courts.detail(placeId, courtId);
  let imageUrl: string | undefined;

  try {
    const caller = await createServerCaller(appRoutes.places.detail(placeId));
    const placeDetails = await caller.place.getByIdOrSlug({
      placeIdOrSlug: placeId,
    });
    const place = placeDetails.place;
    const court = placeDetails.courts.find((c) => c.court.id === courtId);

    if (court) {
      const courtLabel = court.court.label;
      const sportName = court.sport.name;
      const locationLabel = buildLocationLabel(place);

      title = `${courtLabel} · ${place.name}`;
      description = [place.name, courtLabel, sportName, locationLabel]
        .filter(Boolean)
        .join(" · ");
      canonicalPath = appRoutes.places.courts.detail(
        place.slug ?? place.id,
        courtId,
      );
      imageUrl = toAbsoluteUrl(
        placeDetails.photos?.[0]?.url ?? placeDetails.organizationLogoUrl,
      );
    }
  } catch {}

  const openGraphImages = imageUrl
    ? [{ url: imageUrl, alt: `${title} photo` }]
    : undefined;
  const twitterImages = imageUrl ? [imageUrl] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "KudosCourts",
      type: "website",
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImages,
    },
  };
}

export default async function CourtDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { placeId, courtId } = await params;
  const queryParams = await searchParams;

  try {
    const caller = await createServerCaller(appRoutes.places.detail(placeId));
    const placeDetails = await caller.place.getByIdOrSlug({
      placeIdOrSlug: placeId,
    });
    const place = placeDetails.place;
    const slug = place.slug;

    if (slug && isUuid(placeId) && slug !== placeId) {
      const targetPath = appRoutes.places.courts.detail(slug, courtId);
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (typeof value === "string") {
          qs.set(key, value);
        } else if (Array.isArray(value)) {
          for (const v of value) {
            if (v) qs.append(key, v);
          }
        }
      }
      const qsStr = qs.toString();
      redirect(qsStr ? `${targetPath}?${qsStr}` : targetPath);
    }

    const court = placeDetails.courts.find((c) => c.court.id === courtId);
    if (!court || !court.court.isActive) {
      return notFound();
    }

    const placeSlugOrId = slug ?? place.id;

    return (
      <CourtDetailClient
        placeSlugOrId={placeSlugOrId}
        placeId={place.id}
        placeName={place.name}
        placeCity={place.city}
        placeProvince={place.province}
        placeTimeZone={place.timeZone}
        courtId={courtId}
        courtLabel={court.court.label}
        courtTierLabel={court.court.tierLabel ?? undefined}
        sportId={court.sport.id}
        sportName={court.sport.name}
        placeType={place.placeType}
        verificationStatus={placeDetails.verification?.status ?? "UNVERIFIED"}
        reservationsEnabled={
          placeDetails.verification?.reservationsEnabled ?? false
        }
        contactDetail={
          placeDetails.contactDetail
            ? {
                phoneNumber:
                  placeDetails.contactDetail.phoneNumber ?? undefined,
                viberInfo: placeDetails.contactDetail.viberInfo ?? undefined,
                otherContactInfo:
                  placeDetails.contactDetail.otherContactInfo ?? undefined,
              }
            : undefined
        }
      />
    );
  } catch {
    return notFound();
  }
}
