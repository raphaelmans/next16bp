import OwnerPlaceCourtSchedulePage from "@/features/owner/pages/owner-place-court-schedule-page";

type OwnerVenueCourtScheduleRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerVenueCourtScheduleRoutePage({
  params,
  searchParams,
}: OwnerVenueCourtScheduleRoutePageProps) {
  const { placeId, courtId } = await params;
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return (
    <OwnerPlaceCourtSchedulePage
      placeId={placeId}
      courtId={courtId}
      fromSetup={from === "setup"}
    />
  );
}
