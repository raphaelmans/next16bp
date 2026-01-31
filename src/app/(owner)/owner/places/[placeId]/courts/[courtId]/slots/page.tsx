import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type CourtSlotsPageProps = {
  params: Promise<{ placeId: string; courtId: string }>;
};

export default async function CourtSlotsPage({ params }: CourtSlotsPageProps) {
  const { placeId, courtId } = await params;
  redirect(appRoutes.owner.places.courts.availability(placeId, courtId));
}
