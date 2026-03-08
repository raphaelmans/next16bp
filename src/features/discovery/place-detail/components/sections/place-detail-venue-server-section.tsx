import { buildViberDeepLink, toDialablePhone } from "@/common/phone";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoCarousel } from "@/features/discovery/components";
import { PlaceDetailAmenitiesCard } from "@/features/discovery/place-detail/components/place-detail-amenities-card";
import { PlaceDetailContactCard } from "@/features/discovery/place-detail/components/place-detail-contact-card";
import { PlaceDetailReviewsSection } from "@/features/discovery/place-detail/components/place-detail-reviews-section";
import type { PlaceVenueSectionData } from "@/features/discovery/place-detail/server/place-detail-section-data";

type PlaceDetailVenueServerSectionProps = {
  dataPromise: Promise<PlaceVenueSectionData>;
  showPhotos?: boolean;
};

export async function PlaceDetailVenueServerSection({
  dataPromise,
  showPhotos = false,
}: PlaceDetailVenueServerSectionProps) {
  const data = await dataPromise;
  const contactDetail = data.contactDetail;
  const phoneNumber = contactDetail?.phoneNumber?.trim();
  const viberNumber = contactDetail?.viberInfo?.trim();
  const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
  const viberLink = viberNumber ? buildViberDeepLink(viberNumber) : "";
  const hasContactDetail = Boolean(
    contactDetail?.phoneNumber ||
      contactDetail?.websiteUrl ||
      contactDetail?.facebookUrl ||
      contactDetail?.instagramUrl ||
      contactDetail?.viberInfo ||
      contactDetail?.otherContactInfo,
  );

  return (
    <div className="space-y-6">
      {showPhotos && (
        <Card className="overflow-hidden p-0">
          <PhotoCarousel photos={data.photos} courtName={data.placeName} />
        </Card>
      )}
      <PlaceDetailContactCard
        hasContactDetail={hasContactDetail}
        contactDetail={contactDetail}
        phoneNumber={phoneNumber}
        dialablePhone={dialablePhone}
        viberNumber={viberNumber}
        viberLink={viberLink}
      />
      <PlaceDetailAmenitiesCard amenities={data.amenities} />
      <PlaceDetailReviewsSection
        placeId={data.placeId}
        placeSlug={data.placeSlug}
      />
    </div>
  );
}

export function PlaceDetailVenueServerSectionFallback() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
