import PlaceBookingPage from "@/features/reservation/pages/place-booking-page";

type VenueBookRoutePageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VenueBookRoutePage({
  params,
  searchParams,
}: VenueBookRoutePageProps) {
  const { placeId } = await params;
  const queryParams = await searchParams;
  const openPlay = Array.isArray(queryParams.openPlay)
    ? queryParams.openPlay[0]
    : queryParams.openPlay;

  return (
    <PlaceBookingPage
      placeIdOrSlug={placeId}
      initialOpenPlayEnabled={openPlay === "1" || openPlay === "true"}
    />
  );
}
