import OwnerPlaceEditPage from "@/features/owner/pages/owner-place-edit-page";

type OwnerVenueEditRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function OwnerVenueEditRoutePage({
  params,
}: OwnerVenueEditRoutePageProps) {
  const { placeId } = await params;
  return <OwnerPlaceEditPage placeId={placeId} />;
}
