import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export default function PostLoginPage() {
  redirect(appRoutes.dashboard.base);
}
