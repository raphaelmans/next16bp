import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlaceVerificationStatusVariant } from "@/features/discovery/helpers";
import { PlaceDetailCourtsCard } from "@/features/discovery/place-detail/components/place-detail-courts-card";
import type { PlaceCourtsSectionData } from "@/features/discovery/place-detail/server/place-detail-section-data";

type PlaceDetailCourtsServerSectionProps = {
  dataPromise: Promise<PlaceCourtsSectionData>;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: PlaceVerificationStatusVariant;
};

export async function PlaceDetailCourtsServerSection({
  dataPromise,
  showBookingVerificationUi,
  verificationMessage,
  verificationDescription,
  verificationStatusVariant,
}: PlaceDetailCourtsServerSectionProps) {
  const data = await dataPromise;

  return (
    <PlaceDetailCourtsCard
      showBookingVerificationUi={showBookingVerificationUi}
      verificationMessage={verificationMessage}
      verificationDescription={verificationDescription}
      verificationStatusVariant={verificationStatusVariant}
      courts={data.courts}
    />
  );
}

export function PlaceDetailCourtsServerSectionFallback() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
