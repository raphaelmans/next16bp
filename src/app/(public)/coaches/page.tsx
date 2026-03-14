import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { DiscoveryCoachesPage } from "@/features/coach-discovery/pages/coaches-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.coaches.base, appUrl);
const title = "Find Sports Coaches in the Philippines";
const description =
  "Browse independent and venue-linked sports coaches across the Philippines. Filter by sport, city, price, rating, and coaching style on KudosCourts.";

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

type CoachesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  return <DiscoveryCoachesPage searchParams={await searchParams} />;
}
