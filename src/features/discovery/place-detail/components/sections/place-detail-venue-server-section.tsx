import { buildViberDeepLink, toDialablePhone } from "@/common/phone";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceDetailAmenitiesCard } from "@/features/discovery/place-detail/components/place-detail-amenities-card";
import { PlaceDetailContactCard } from "@/features/discovery/place-detail/components/place-detail-contact-card";
import type { PlaceVenueSectionData } from "@/features/discovery/place-detail/server/place-detail-section-data";

type PlaceDetailVenueServerSectionProps = {
  dataPromise: Promise<PlaceVenueSectionData>;
};

export async function PlaceDetailVenueServerSection({
  dataPromise,
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
      <PlaceDetailContactCard
        hasContactDetail={hasContactDetail}
        contactDetail={contactDetail}
        phoneNumber={phoneNumber}
        dialablePhone={dialablePhone}
        viberNumber={viberNumber}
        viberLink={viberLink}
      />
      <PlaceDetailAmenitiesCard amenities={data.amenities} />
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
