import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.ownersGetStarted.base, appUrl);
const title = "Free reservation system for venues";
const description =
  "Create an owner account, list or claim your venue, submit verification, and start accepting online reservations. Free for venues in the Philippines.";

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
