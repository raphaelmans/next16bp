import type { Metadata } from "next";
import {
  generatePlaceDetailMetadata,
  renderPlaceDetailPage,
} from "@/features/discovery/pages/place-detail-page";

type PlaceDetailRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export const revalidate = false;

export async function generateMetadata({
  params,
}: PlaceDetailRoutePageProps): Promise<Metadata> {
  const { placeId } = await params;
  return generatePlaceDetailMetadata(placeId);
}

export default async function PlaceDetailRoutePage({
  params,
}: PlaceDetailRoutePageProps) {
  const { placeId } = await params;
  return renderPlaceDetailPage(placeId);
}
