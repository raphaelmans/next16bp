import type { Metadata } from "next";
import {
  generateCoachDetailMetadata,
  renderCoachDetailPage,
} from "@/features/coach-discovery/pages/coach-detail-page";

type CoachDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CoachDetailRoutePageProps): Promise<Metadata> {
  const { id } = await params;
  return generateCoachDetailMetadata(id);
}

export default async function CoachDetailRoutePage({
  params,
}: CoachDetailRoutePageProps) {
  const { id } = await params;
  return renderCoachDetailPage(id);
}
