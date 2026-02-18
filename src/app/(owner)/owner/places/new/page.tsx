import OwnerPlaceNewPage from "@/features/owner/pages/owner-place-new-page";

type OwnerPlaceNewRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerPlaceNewRoutePage({
  searchParams,
}: OwnerPlaceNewRoutePageProps) {
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return <OwnerPlaceNewPage fromSetup={from === "setup"} />;
}
