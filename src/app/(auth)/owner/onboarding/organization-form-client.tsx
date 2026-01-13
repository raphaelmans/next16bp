"use client";

import { useRouter } from "next/navigation";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { appRoutes } from "@/shared/lib/app-routes";

export function OrganizationFormClient() {
  const router = useRouter();

  return (
    <OrganizationForm
      onSuccess={() => router.push(appRoutes.owner.places.new)}
      onCancel={() => router.push(appRoutes.home.base)}
    />
  );
}
