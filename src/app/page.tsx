import type { Metadata } from "next";
import { HomeLandingPage } from "@/features/home/pages/home-landing-page";
import { env } from "@/lib/env";
import {
  getHomeFeaturedPlaces,
  prefetchHomeData,
} from "@/lib/modules/home/server/home-page-data";
import { HydrateClient } from "@/trpc/server";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL("/", appUrl);
const title = "Find Pickleball & Sports Courts in the Philippines";
const description =
  "Discover pickleball, basketball, badminton, and tennis courts across the Philippines. Check availability, book your next game, and list your venue with a free reservation system.";

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
  const featuredPlaces = await getHomeFeaturedPlaces();

  await prefetchHomeData();

  return (
    <HydrateClient>
      <HomeLandingPage featuredPlaces={featuredPlaces} />
    </HydrateClient>
  );
}
