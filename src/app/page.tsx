import type { Metadata } from "next";
import Script from "next/script";
import { HOME_FAQS } from "@/features/home/constants/home-faq";
import { HomeLandingPage } from "@/features/home/pages/home-landing-page";
import {
  getHomeFeaturedPlaces,
  getHomePlaceStats,
} from "@/lib/modules/home/server/home-page-data";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL("/", appUrl);
const title =
  "Discover Sports Courts in the Philippines — Badminton, Basketball, Tennis & More";
const description =
  "Find sports courts across the Philippines by city or sport. Read player reviews, check amenities and availability, and discover your next game — all in one place.";

const homeStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
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

export default async function HomePage() {
  const [featuredPlaces, placeStats] = await Promise.all([
    getHomeFeaturedPlaces(),
    getHomePlaceStats(),
  ]);

  return (
    <>
      <Script id="home-faq-structured-data" type="application/ld+json">
        {JSON.stringify(homeStructuredData).replace(/</g, "\\u003c")}
      </Script>
      <HomeLandingPage
        featuredPlaces={featuredPlaces}
        placeStats={placeStats}
      />
    </>
  );
}
