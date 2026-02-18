import PlaceBookingPage from "@/features/reservation/pages/place-booking-page";

type CourtBookRoutePageProps = {
  params: Promise<{ id: string; slotId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CourtBookRoutePage({
  params,
  searchParams,
}: CourtBookRoutePageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const openPlay = Array.isArray(queryParams.openPlay)
    ? queryParams.openPlay[0]
    : queryParams.openPlay;

  return (
    <PlaceBookingPage
      placeIdOrSlug={id}
      initialOpenPlayEnabled={openPlay === "1" || openPlay === "true"}
    />
  );
}
