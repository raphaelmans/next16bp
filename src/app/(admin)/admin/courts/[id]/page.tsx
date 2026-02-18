import AdminCourtEditPage from "@/features/admin/pages/admin-court-edit-page";

type AdminCourtEditRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCourtEditRoutePage({
  params,
}: AdminCourtEditRoutePageProps) {
  const { id } = await params;
  return <AdminCourtEditPage courtId={id} />;
}
