import OwnerPlaceCourtAvailabilityPage from "@/features/owner/pages/owner-place-court-availability-page";

type OwnerPlaceCourtAvailabilityRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerPlaceCourtAvailabilityRoutePage({
  params,
  searchParams,
}: OwnerPlaceCourtAvailabilityRoutePageProps) {
  const { placeId, courtId } = await params;
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return (
    <OwnerPlaceCourtAvailabilityPage
      placeId={placeId}
      courtId={courtId}
      fromSetup={from === "setup"}
    />
  );
}
