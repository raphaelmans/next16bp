import { redirect } from "next/navigation";
import { appRoutes } from "@/shared/lib/app-routes";

/**
 * Legacy dashboard route - redirects to /home
 *
 * This route is maintained for backward compatibility.
 * All authenticated users should land on /home instead.
 *
 * @see agent-plans/user-stories/00-onboarding/00-08-bugfix-dashboard-redirect.md
 */
export default function DashboardPage() {
  redirect(appRoutes.home.base);
}
