"use client";

import OwnerBookingsImportReviewView from "@/features/owner/components/owner-bookings-import-review-view";

type OwnerBookingsImportReviewPageProps = {
  jobId: string;
};

export default function OwnerBookingsImportReviewPage({
  jobId,
}: OwnerBookingsImportReviewPageProps) {
  return <OwnerBookingsImportReviewView jobId={jobId} />;
}
