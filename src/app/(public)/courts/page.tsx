import type { Metadata } from "next";
import { env } from "@/lib/env";
import { appRoutes } from "@/shared/lib/app-routes";
import CourtsPageClient from "./courts-page-client";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.courts.base, appUrl);
const title = "Browse courts near you";
const description =
  "Discover pickleball, tennis, basketball, and more courts near you. Filter by city, amenities, and availability on KudosCourts.";

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
  return <CourtsPageClient />;
}
