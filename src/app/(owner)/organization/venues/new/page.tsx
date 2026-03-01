import OwnerPlaceNewPage from "@/features/owner/pages/owner-place-new-page";

type OwnerVenueNewRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerVenueNewRoutePage({
  searchParams,
}: OwnerVenueNewRoutePageProps) {
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return <OwnerPlaceNewPage fromSetup={from === "setup"} />;
}
