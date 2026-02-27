"use client";

import OwnerBookingsImportReviewView from "@/features/owner/components/owner-bookings-import-review-view";
import { PermissionGate } from "@/features/owner/components/permission-gate";

type OwnerBookingsImportReviewPageProps = {
  jobId: string;
};

export default function OwnerBookingsImportReviewPage({
  jobId,
}: OwnerBookingsImportReviewPageProps) {
  return (
    <PermissionGate
      accessRule={{
        type: "permission",
        permission: "reservation.guest_booking",
      }}
    >
      <OwnerBookingsImportReviewView jobId={jobId} />
    </PermissionGate>
  );
}
