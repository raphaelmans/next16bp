"use client";

import { AdminCourtEditView } from "@/features/admin/components/admin-court-edit-view";

type AdminCourtEditPageProps = {
  courtId: string;
};

export default function AdminCourtEditPage({
  courtId,
}: AdminCourtEditPageProps) {
  return <AdminCourtEditView courtId={courtId} />;
}
