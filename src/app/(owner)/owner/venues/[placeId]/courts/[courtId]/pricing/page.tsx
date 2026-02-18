import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type OwnerVenueCourtPricingRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function OwnerVenueCourtPricingRoutePage({
  params,
}: OwnerVenueCourtPricingRoutePageProps) {
  const { placeId, courtId } = await params;
  redirect(appRoutes.owner.places.courts.schedule(placeId, courtId));
}
