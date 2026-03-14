import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export default function CoachPortalIndexPage() {
  redirect(appRoutes.coach.getStarted);
}
