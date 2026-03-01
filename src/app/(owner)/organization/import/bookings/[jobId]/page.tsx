import OwnerBookingsImportReviewPage from "@/features/owner/pages/owner-bookings-import-review-page";

type OwnerBookingsImportReviewRoutePageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function OwnerBookingsImportReviewRoutePage({
  params,
}: OwnerBookingsImportReviewRoutePageProps) {
  const { jobId } = await params;
  return <OwnerBookingsImportReviewPage jobId={jobId} />;
}
