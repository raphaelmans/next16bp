import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type VenueScheduleRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function VenueScheduleRoutePage({
  params,
}: VenueScheduleRoutePageProps) {
  const { placeId } = await params;
  redirect(appRoutes.courts.detail(placeId));
}
