import type { Metadata } from "next";
import HomePageClient from "@/app/home-page-client";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL("/", appUrl);
const title = "Find courts near you";
const description =
  "Discover pickleball and multi-sport courts, check availability, and reserve time fast with KudosCourts.";

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

export default function HomePage() {
  return <HomePageClient />;
}
