import type { ComponentProps } from "react";
import CourtDetailClient from "@/features/discovery/place-detail/components/court-detail-client";

export type CourtDetailPageProps = ComponentProps<typeof CourtDetailClient>;

export function CourtDetailPage(props: CourtDetailPageProps) {
  return <CourtDetailClient {...props} />;
}
