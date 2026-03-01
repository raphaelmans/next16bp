import OwnerPlaceCourtsPage from "@/features/owner/pages/owner-place-courts-page";

type OwnerPlaceCourtsRoutePageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerPlaceCourtsRoutePage({
  params,
  searchParams,
}: OwnerPlaceCourtsRoutePageProps) {
  const { placeId } = await params;
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return (
    <OwnerPlaceCourtsPage placeId={placeId} isFromSetup={from === "setup"} />
  );
}
