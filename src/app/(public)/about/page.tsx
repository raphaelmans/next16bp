import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { AboutPageView } from "@/features/home/pages/about-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.about.base, appUrl);
const title = "About KudosCourts";
const description =
  "KudosCourts is a free reservation system for sports venues in the Philippines, helping players discover courts and reserve time with less back-and-forth.";

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

export default function AboutPage() {
  return <AboutPageView />;
}
