import { notFound, redirect } from "next/navigation";
import { isUuid } from "@/lib/slug";
import { createServerCaller } from "@/shared/infra/trpc/server";
import { appRoutes } from "@/shared/lib/app-routes";
import PlaceDetailClient from "./place-detail-client";

export { generateMetadata } from "../../courts/[id]/page";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { placeId } = await params;

  try {
    const caller = await createServerCaller(appRoutes.places.detail(placeId));
    const placeDetails = await caller.place.getByIdOrSlug({
      placeIdOrSlug: placeId,
    });
    const slug = placeDetails.place.slug;

    if (slug && isUuid(placeId) && slug !== placeId) {
      redirect(appRoutes.places.detail(slug));
    }
  } catch {
    return notFound();
  }

  return <PlaceDetailClient />;
}
