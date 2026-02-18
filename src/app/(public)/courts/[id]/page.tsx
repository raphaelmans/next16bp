import type { Metadata } from "next";
import {
  generatePlaceDetailMetadata,
  renderPlaceDetailPage,
} from "@/features/discovery/pages/place-detail-page";

type CourtDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CourtDetailRoutePageProps): Promise<Metadata> {
  const { id } = await params;
  return generatePlaceDetailMetadata(id);
}

export default async function CourtDetailRoutePage({
  params,
}: CourtDetailRoutePageProps) {
  const { id } = await params;
  return renderPlaceDetailPage(id);
}
