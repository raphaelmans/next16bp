import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

interface CourtPricingPageProps {
  params: {
    placeId: string;
    courtId: string;
  };
}

export default function CourtPricingPage({ params }: CourtPricingPageProps) {
  redirect(
    appRoutes.owner.places.courts.schedule(params.placeId, params.courtId),
  );
}
