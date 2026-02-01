import type { Metadata } from "next";
import HomePageClient from "@/app/home-page-client";
import { mapPlaceSummary } from "@/features/discovery/helpers";
import { env } from "@/lib/env";
import { publicCaller } from "@/trpc/server";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL("/", appUrl);
const title = "Find Pickleball & Sports Courts in the Philippines";
const description =
  "Discover pickleball, basketball, badminton, and tennis courts across the Philippines. Check availability and book your next game on KudosCourts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
  },
  twitter: {
    title,
    description,
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const featuredInput = {
    featuredOnly: true,
    limit: 3,
    offset: 0,
  };
  const featuredResponse = await publicCaller.place.list(featuredInput);
  const featuredPlaces = featuredResponse.items.map(mapPlaceSummary);

  return <HomePageClient featuredPlaces={featuredPlaces} />;
}
