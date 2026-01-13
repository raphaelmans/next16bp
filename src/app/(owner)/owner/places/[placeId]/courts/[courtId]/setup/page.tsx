import { redirect } from "next/navigation";
import { appRoutes } from "@/shared/lib/app-routes";

interface CourtSetupRedirectPageProps {
  params: {
    placeId: string;
    courtId: string;
  };
}

export default function CourtSetupRedirectPage({
  params,
}: CourtSetupRedirectPageProps) {
  redirect(appRoutes.owner.places.courts.setup(params.placeId, params.courtId));
}
