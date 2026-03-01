import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

type ManageSlotsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageSlotsPage({
  params,
}: ManageSlotsPageProps) {
  const { id } = await params;
  redirect(appRoutes.organization.courts.availability(id));
}
