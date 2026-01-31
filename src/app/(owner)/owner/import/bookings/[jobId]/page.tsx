"use client";

import { useParams } from "next/navigation";
import OwnerBookingsImportReviewView from "@/features/owner/components/owner-bookings-import-review-view";

export default function OwnerBookingsImportReviewPage() {
  const params = useParams<{ jobId: string }>();
  return <OwnerBookingsImportReviewView jobId={params.jobId} />;
}
