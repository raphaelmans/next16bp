import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { AboutPageView } from "@/features/home/pages/about-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.about.base, appUrl);
const title = "About KudosCourts";
const description =
  "KudosCourts is a player-first sports venue discovery platform for the Philippines, built to help players find courts faster and help venues get found with full control.";

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
