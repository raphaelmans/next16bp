import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  redirect(appRoutes.organization.getStarted);
}
