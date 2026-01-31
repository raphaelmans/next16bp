import { permanentRedirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export default function ListYourVenuePage() {
  permanentRedirect(appRoutes.ownersGetStarted.base);
}
