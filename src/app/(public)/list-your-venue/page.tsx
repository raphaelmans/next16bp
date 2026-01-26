import { permanentRedirect } from "next/navigation";
import { appRoutes } from "@/shared/lib/app-routes";

export default function ListYourVenuePage() {
  permanentRedirect(appRoutes.ownersGetStarted.base);
}
