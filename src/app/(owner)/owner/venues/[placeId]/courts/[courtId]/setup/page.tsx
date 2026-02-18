import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type OwnerVenueCourtSetupRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function OwnerVenueCourtSetupRoutePage({
  params,
}: OwnerVenueCourtSetupRoutePageProps) {
  const { placeId, courtId } = await params;
  redirect(appRoutes.owner.places.courts.setup(placeId, courtId));
}
