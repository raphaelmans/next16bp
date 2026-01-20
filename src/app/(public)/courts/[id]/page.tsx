import type { Metadata } from "next";
import { createServerCaller } from "@/shared/infra/trpc/server";
import { appRoutes } from "@/shared/lib/app-routes";

export { default } from "../../places/[placeId]/page";

type CourtPageParams = {
  id: string;
};

const formatCourtCount = (count: number) =>
  `${count} court${count === 1 ? "" : "s"}`;

const buildLocationLabel = (place: {
  city: string;
  province: string;
  address: string;
}) => {
  const parts = [place.city, place.province].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }
  return place.address;
};

const buildDescription = (
  place: { name: string; city: string; province: string; address: string },
  courtCount: number,
  sports: string[],
) => {
  const locationLabel = buildLocationLabel(place);
  const sportLabel = sports.length > 0 ? `Sports: ${sports.join(", ")}` : "";
  return [place.name, locationLabel, formatCourtCount(courtCount), sportLabel]
    .filter(Boolean)
    .join(" | ");
};

export async function generateMetadata({
  params,
}: {
  params: Promise<CourtPageParams>;
}): Promise<Metadata> {
  const { id } = await params;

  const canonicalPath = appRoutes.courts.detail(id);

  let title = "Court details";
  let description = "View court details on KudosCourts.";

  try {
    const caller = await createServerCaller(canonicalPath);
    const placeDetails = await caller.place.getById({ placeId: id });
    const place = placeDetails.place;
    const sports = placeDetails.sports
      .map((sport) => sport.name)
      .filter(Boolean);

    title = place.name;
    description = buildDescription(place, placeDetails.courts.length, sports);
  } catch {}

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "KudosCourts",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
