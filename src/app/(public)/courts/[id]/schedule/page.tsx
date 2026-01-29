import { redirect } from "next/navigation";
import { appRoutes } from "@/shared/lib/app-routes";

export default async function CourtScheduleRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(appRoutes.courts.detail(id));
}
