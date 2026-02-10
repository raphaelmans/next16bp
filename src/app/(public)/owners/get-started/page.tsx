import type { Metadata } from "next";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import OwnersGetStartedClient from "./page-client";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "Free Court Reservation System for Sports Venues — Philippines";
const description =
  "List or claim your sports venue, submit verification, and start accepting online reservations. Free reservation system for venues in the Philippines.";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "KudosCourts",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  url: canonicalUrl.toString(),
  description:
    "Free reservation system for sports venues in the Philippines. List or claim a venue, verify ownership, and accept online reservations.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "PHP",
  },
  areaServed: {
    "@type": "Country",
    name: "Philippines",
  },
  isAccessibleForFree: true,
} as const;

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

export default function OwnersGetStartedPage() {
  return (
    <>
      <Script
        id="owners-get-started-structured-data"
        type="application/ld+json"
      >
        {JSON.stringify(structuredData)}
      </Script>
      <OwnersGetStartedClient />
    </>
  );
}
