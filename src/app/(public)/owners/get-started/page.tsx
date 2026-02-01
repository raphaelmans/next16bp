import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import OwnersGetStartedClient from "./page-client";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "List Your Sports Venue on KudosCourts — Philippines";
const description =
  "Get your pickleball, basketball, or badminton venue bookable online. Join the Philippines' growing court booking platform.";

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
  return <OwnersGetStartedClient />;
}
