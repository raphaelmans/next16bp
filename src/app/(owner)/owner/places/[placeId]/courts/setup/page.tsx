import OwnerPlaceCourtSetupPage from "@/features/owner/pages/owner-place-court-setup-page";

type OwnerPlaceCourtSetupRoutePageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerPlaceCourtSetupRoutePage({
  params,
  searchParams,
}: OwnerPlaceCourtSetupRoutePageProps) {
  const { placeId } = await params;
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return (
    <OwnerPlaceCourtSetupPage placeId={placeId} fromSetup={from === "setup"} />
  );
}
