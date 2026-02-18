import AdminVerificationDetailPage from "@/features/admin/pages/admin-verification-detail-page";

type AdminVerificationDetailRoutePageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function AdminVerificationDetailRoutePage({
  params,
}: AdminVerificationDetailRoutePageProps) {
  const { requestId } = await params;
  return <AdminVerificationDetailPage requestId={requestId} />;
}
