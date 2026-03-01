import OwnerPlaceCourtNewPage from "@/features/owner/pages/owner-place-court-new-page";

type OwnerVenueCourtNewRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function OwnerVenueCourtNewRoutePage({
  params,
}: OwnerVenueCourtNewRoutePageProps) {
  const { placeId } = await params;
  return <OwnerPlaceCourtNewPage placeId={placeId} />;
}
