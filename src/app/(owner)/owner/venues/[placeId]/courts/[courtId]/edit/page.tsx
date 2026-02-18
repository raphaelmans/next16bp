import OwnerPlaceCourtEditPage from "@/features/owner/pages/owner-place-court-edit-page";

type OwnerVenueCourtEditRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function OwnerVenueCourtEditRoutePage({
  params,
}: OwnerVenueCourtEditRoutePageProps) {
  const { placeId, courtId } = await params;
  return <OwnerPlaceCourtEditPage placeId={placeId} courtId={courtId} />;
}
