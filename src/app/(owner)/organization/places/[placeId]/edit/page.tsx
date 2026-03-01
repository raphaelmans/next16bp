import OwnerPlaceEditPage from "@/features/owner/pages/owner-place-edit-page";

type OwnerPlaceEditRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function OwnerPlaceEditRoutePage({
  params,
}: OwnerPlaceEditRoutePageProps) {
  const { placeId } = await params;
  return <OwnerPlaceEditPage placeId={placeId} />;
}
