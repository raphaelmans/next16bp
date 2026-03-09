import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type PlaceScheduleRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function PlaceScheduleRoutePage({
  params,
}: PlaceScheduleRoutePageProps) {
  const { placeId } = await params;
  redirect(appRoutes.places.detail(placeId));
}
