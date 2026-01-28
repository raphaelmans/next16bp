import type { Metadata } from "next";
import { env } from "@/lib/env";
import { appRoutes } from "@/shared/lib/app-routes";
import OwnersGetStartedClient from "./page-client";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "Get your venue bookable on KudosCourts";
const description =
  "Create an owner account, add or claim your venue, and submit verification to accept reservations on KudosCourts.";

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
