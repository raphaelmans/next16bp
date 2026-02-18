import OwnerPlaceCourtEditPage from "@/features/owner/pages/owner-place-court-edit-page";

type OwnerPlaceCourtEditRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function OwnerPlaceCourtEditRoutePage({
  params,
}: OwnerPlaceCourtEditRoutePageProps) {
  const { placeId, courtId } = await params;
  return <OwnerPlaceCourtEditPage placeId={placeId} courtId={courtId} />;
}
