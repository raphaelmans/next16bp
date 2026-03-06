import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { HOME_FAQS } from "@/features/home/constants/home-faq";
import { HomeLandingPage } from "@/features/home/pages/home-landing-page";
import {
  getHomeFeaturedPlaces,
  prefetchHomeData,
} from "@/lib/modules/home/server/home-page-data";
import { getServerSession } from "@/lib/shared/infra/auth/server-session";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";
import { HydrateClient } from "@/trpc/server";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL("/", appUrl);
const title =
  "Book Pickleball, Badminton, Basketball, and Tennis Courts in the Philippines";
const description =
  "Search available sports courts across the Philippines, compare venues by city, and reserve your slot online. Owners can list and manage courts with free core tools.";

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
  const cookieStore = await cookies();
  const portalCookie = cookieStore.get("kudos.portal-context");
  if (portalCookie?.value === "organization") {
    const session = await getServerSession();
    if (session) {
      redirect("/organization");
    }
  }

  const featuredPlaces = await getHomeFeaturedPlaces();

  await prefetchHomeData();

  const portalRedirectScript = [
    "try{",
    // Skip redirect if no Supabase auth cookie (user is logged out)
    "if(!/sb-[^=]+-auth-token=/.test(document.cookie))throw 0;",
    'var p=localStorage.getItem("kudos.default-portal");',
    'if(p==="owner"){localStorage.setItem("kudos.default-portal","organization");p="organization";}',
    'if(p==="organization")location.replace("/organization");',
    'else if(p==="player")location.replace("/home")',
    "}catch(e){}",
  ].join("");

  return (
    <>
      <script
        id="portal-redirect"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: hardcoded string literal, no user input
        dangerouslySetInnerHTML={{ __html: portalRedirectScript }}
      />
      <Script id="home-faq-structured-data" type="application/ld+json">
        {JSON.stringify(homeStructuredData).replace(/</g, "\\u003c")}
      </Script>
      <HydrateClient>
        <HomeLandingPage featuredPlaces={featuredPlaces} />
      </HydrateClient>
    </>
  );
}
