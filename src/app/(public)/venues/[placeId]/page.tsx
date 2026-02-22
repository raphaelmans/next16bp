import type { Metadata } from "next";
import {
  generatePlaceDetailMetadata,
  renderPlaceDetailPage,
} from "@/features/discovery/pages/place-detail-page";

type VenueDetailRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: VenueDetailRoutePageProps): Promise<Metadata> {
  const { placeId } = await params;
  return generatePlaceDetailMetadata(placeId);
}

export default async function VenueDetailRoutePage({
  params,
}: VenueDetailRoutePageProps) {
  const { placeId } = await params;
  return renderPlaceDetailPage(placeId);
}
