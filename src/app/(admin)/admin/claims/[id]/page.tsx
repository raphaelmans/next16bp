import AdminClaimDetailPage from "@/features/admin/pages/admin-claim-detail-page";

type AdminClaimDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClaimDetailRoutePage({
  params,
}: AdminClaimDetailRoutePageProps) {
  const { id } = await params;
  return <AdminClaimDetailPage claimId={id} />;
}
