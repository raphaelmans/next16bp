import { notFound } from "next/navigation";
import { createServerCaller } from "@/shared/infra/trpc/server";
import { appRoutes } from "@/shared/lib/app-routes";
import PlaceDetailClient from "../../places/[placeId]/page";

export { generateMetadata } from "../../courts/[id]/page";

type VenuePageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function VenueDetailPage({ params }: VenuePageProps) {
  const { placeId } = await params;

  try {
    const caller = await createServerCaller(appRoutes.places.detail(placeId));
    await caller.place.getByIdOrSlug({ placeIdOrSlug: placeId });
  } catch {
    return notFound();
  }

  return <PlaceDetailClient />;
}
