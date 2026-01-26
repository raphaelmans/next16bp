import type { Metadata } from "next";
import { env } from "@/lib/env";
import { appRoutes } from "@/shared/lib/app-routes";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "Get your venue bookable on KudosCourts";
const description =
  "Create an owner account, add or claim your venue, and submit verification to unlock online reservations on KudosCourts.";

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

export default function OwnersGetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
