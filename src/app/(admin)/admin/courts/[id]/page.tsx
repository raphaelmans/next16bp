"use client";

import { useParams } from "next/navigation";
import { AdminCourtEditView } from "@/features/admin/components/admin-court-edit-view";

export default function AdminCourtEditPage() {
  const params = useParams();
  const courtId = params.id as string;

  return <AdminCourtEditView courtId={courtId} />;
}
