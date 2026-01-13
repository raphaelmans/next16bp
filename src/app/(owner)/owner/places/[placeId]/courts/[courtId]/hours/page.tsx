import { redirect } from "next/navigation";
import { appRoutes } from "@/shared/lib/app-routes";

interface CourtHoursPageProps {
  params: {
    placeId: string;
    courtId: string;
  };
}

export default function CourtHoursPage({ params }: CourtHoursPageProps) {
  redirect(
    appRoutes.owner.places.courts.schedule(params.placeId, params.courtId),
  );
}
