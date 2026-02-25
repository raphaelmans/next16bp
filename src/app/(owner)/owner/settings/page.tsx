import OwnerSettingsPage from "@/features/owner/pages/owner-settings-page";

type OwnerSettingsRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerSettingsRoutePage({
  searchParams,
}: OwnerSettingsRoutePageProps) {
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return <OwnerSettingsPage fromSetup={from === "setup"} />;
}
