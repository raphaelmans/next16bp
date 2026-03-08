import type { Metadata } from "next";
import Script from "next/script";
import { appRoutes } from "@/common/app-routes";
import { OWNER_GET_STARTED_FAQS } from "@/features/owner/constants/owner-get-started-faq";
import { OwnerPublicGetStartedPage } from "@/features/owner/pages/owner-public-get-started-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "List Your Sports Venue Online in the Philippines";
const description =
  "Help players find your sports venue by city and sport, keep full control of your listing and operations, and manage availability when it makes sense for your venue.";

const faqStructuredData = {
  "@type": "FAQPage",
  mainEntity: OWNER_GET_STARTED_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
} as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "KudosCourts",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      url: canonicalUrl.toString(),
      description:
        "Discovery and reservation workflow software for sports venues in the Philippines. List or claim your venue, verify ownership, and manage availability with full control.",
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
    },
    faqStructuredData,
  ],
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
        {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
      </Script>
      <OwnerPublicGetStartedPage />
    </>
  );
}
