import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { buildLocationLabel } from "@/common/seo-helpers";
import { isSeoIndexablePlaceSurface } from "@/common/seo-indexability";
import { PlaceReviewsPageContent } from "@/features/discovery/place-detail/components/place-reviews-page-content";
import { getPlaceCoreSectionData } from "@/features/discovery/place-detail/server/place-detail-section-data";
import {
  buildCanonicalUrl,
  getCanonicalOrigin,
} from "@/lib/shared/utils/canonical-origin";
import { isUuid } from "@/lib/slug";
import { publicCaller } from "@/trpc/server";

const REVIEWS_PER_PAGE = 10;

type ReviewsPageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const revalidate = false;

export async function generateMetadata({
  params,
  searchParams,
}: ReviewsPageProps): Promise<Metadata> {
  const { placeId: placeIdOrSlug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  try {
    const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
    const place = coreData.placeDetails.place;
    const slug = place.slug ?? place.id;
    const canonicalPath = appRoutes.places.reviews(slug);
    const canonicalUrl =
      currentPage > 1 ? `${canonicalPath}?page=${currentPage}` : canonicalPath;

    const locationLabel = buildLocationLabel(place);
    const title = locationLabel
      ? `Reviews for ${place.name} in ${locationLabel}`
      : `Reviews for ${place.name}`;

    let aggregate: { averageRating: number; reviewCount: number } | null = null;
    try {
      aggregate = await publicCaller.placeReview.aggregate({
        placeId: place.id,
      });
    } catch {
      // non-critical
    }

    const ratingDescription =
      aggregate && aggregate.reviewCount > 0
        ? ` Rated ${aggregate.averageRating.toFixed(1)}/5 from ${aggregate.reviewCount} reviews.`
        : "";
    const description = `Read reviews for ${place.name}.${ratingDescription} Real player experiences on KudosCourts.`;

    const hasContactDetails = Boolean(
      coreData.placeDetails.contactDetail?.phoneNumber?.trim() ||
        coreData.placeDetails.contactDetail?.websiteUrl?.trim() ||
        coreData.placeDetails.contactDetail?.facebookUrl?.trim() ||
        coreData.placeDetails.contactDetail?.instagramUrl?.trim() ||
        coreData.placeDetails.contactDetail?.viberInfo?.trim() ||
        coreData.placeDetails.contactDetail?.otherContactInfo?.trim(),
    );
    const shouldIndex = isSeoIndexablePlaceSurface({
      slug,
      name: place.name,
      address: place.address,
      city: place.city,
      province: place.province,
      activeCourtCount: coreData.placeDetails.courts.filter(
        (c) => c.court.isActive,
      ).length,
      photoCount: coreData.placeDetails.photos.length,
      hasContactDetails,
      verificationStatus: coreData.placeDetails.verification?.status ?? null,
    });

    const totalPages = aggregate
      ? Math.ceil(aggregate.reviewCount / REVIEWS_PER_PAGE)
      : 1;
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    const other: Record<string, string> = {};
    if (prevPage) {
      other["link-prev"] =
        prevPage === 1
          ? buildCanonicalUrl(canonicalPath)
          : buildCanonicalUrl(`${canonicalPath}?page=${prevPage}`);
    }
    if (nextPage) {
      other["link-next"] = buildCanonicalUrl(
        `${canonicalPath}?page=${nextPage}`,
      );
    }

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: shouldIndex
        ? { index: true, follow: true }
        : { index: false, follow: true },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "KudosCourts",
        type: "website",
      },
      other,
    };
  } catch {
    return {
      title: "Reviews",
      robots: { index: false, follow: true },
    };
  }
}

export default async function PlaceReviewsPage({
  params,
  searchParams,
}: ReviewsPageProps) {
  const { placeId: placeIdOrSlug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  let coreData: Awaited<ReturnType<typeof getPlaceCoreSectionData>>;
  try {
    coreData = await getPlaceCoreSectionData(placeIdOrSlug);
  } catch {
    return notFound();
  }

  const place = coreData.placeDetails.place;
  const slug = place.slug ?? place.id;

  // UUID → slug redirect
  if (slug && isUuid(placeIdOrSlug) && slug !== placeIdOrSlug) {
    redirect(appRoutes.places.reviews(slug));
  }

  const offset = (currentPage - 1) * REVIEWS_PER_PAGE;

  const [reviewsResult, aggregate] = await Promise.all([
    publicCaller.placeReview.list({
      placeId: place.id,
      limit: REVIEWS_PER_PAGE,
      offset,
    }),
    publicCaller.placeReview.aggregate({ placeId: place.id }),
  ]);

  if (aggregate.reviewCount === 0) {
    redirect(appRoutes.places.detail(slug));
  }

  const totalPages = Math.ceil(reviewsResult.total / REVIEWS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) {
    redirect(appRoutes.places.reviews(slug));
  }

  const appUrl = getCanonicalOrigin();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${new URL(appRoutes.places.detail(slug), appUrl).toString()}#sports-activity-location`,
    name: place.name,
    url: new URL(appRoutes.places.detail(slug), appUrl).toString(),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: aggregate.averageRating.toFixed(1),
      reviewCount: aggregate.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviewsResult.items.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.authorDisplayName ?? "Player",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      datePublished: new Date(review.createdAt).toISOString().split("T")[0],
      ...(review.body ? { reviewBody: review.body } : {}),
    })),
  };

  return (
    <>
      <Script id="reviews-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
      </Script>
      <PlaceReviewsPageContent
        placeName={place.name}
        placeSlug={slug}
        reviews={reviewsResult.items}
        total={reviewsResult.total}
        currentPage={currentPage}
        aggregate={aggregate}
      />
    </>
  );
}
