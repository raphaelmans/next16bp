import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export default function SubmitCourtRedirectPage() {
  redirect(appRoutes.submitVenue.base);
}
