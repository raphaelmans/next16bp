import OwnerPlaceCourtNewPage from "@/features/owner/pages/owner-place-court-new-page";

type OwnerPlaceCourtNewRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function OwnerPlaceCourtNewRoutePage({
  params,
}: OwnerPlaceCourtNewRoutePageProps) {
  const { placeId } = await params;
  return <OwnerPlaceCourtNewPage placeId={placeId} />;
}
