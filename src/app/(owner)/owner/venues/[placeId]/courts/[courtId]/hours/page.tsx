import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type OwnerVenueCourtHoursRoutePageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function OwnerVenueCourtHoursRoutePage({
  params,
}: OwnerVenueCourtHoursRoutePageProps) {
  const { placeId, courtId } = await params;
  redirect(appRoutes.owner.places.courts.schedule(placeId, courtId));
}
