import OwnerCourtEditPage from "@/features/owner/pages/owner-court-edit-page";

type OwnerCourtEditRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function OwnerCourtEditRoutePage({
  params,
}: OwnerCourtEditRoutePageProps) {
  const { id } = await params;
  return <OwnerCourtEditPage courtId={id} />;
}
