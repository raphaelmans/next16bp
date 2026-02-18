import OwnerVerificationPlacePage from "@/features/owner/pages/owner-verification-place-page";

type OwnerVerificationPlaceRoutePageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerVerificationPlaceRoutePage({
  params,
  searchParams,
}: OwnerVerificationPlaceRoutePageProps) {
  const { placeId } = await params;
  const queryParams = await searchParams;
  const from = Array.isArray(queryParams.from)
    ? queryParams.from[0]
    : queryParams.from;

  return <OwnerVerificationPlacePage placeId={placeId} from={from} />;
}
