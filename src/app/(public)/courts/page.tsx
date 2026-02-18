import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { DiscoveryCourtsPage } from "@/features/discovery/pages/courts-page";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.courts.base, appUrl);
const title = "Browse Sports Courts in the Philippines";
const description =
  "Find and book pickleball, basketball, tennis, and badminton courts across the Philippines. Filter by city, sport, and availability on KudosCourts.";

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

export default function CourtsPage() {
  return <DiscoveryCourtsPage />;
}
