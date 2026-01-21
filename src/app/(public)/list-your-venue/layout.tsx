import type { Metadata } from "next";
import { env } from "@/lib/env";
import { appRoutes } from "@/shared/lib/app-routes";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://www.kudoscourts.com";
const canonicalUrl = new URL(appRoutes.listYourVenue.base, appUrl);
const title = "List your venue";
const description =
  "List your venue on KudosCourts and start accepting bookings. Create your organization, add your venue, and submit verification to unlock reservations.";

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

export default function ListYourVenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
