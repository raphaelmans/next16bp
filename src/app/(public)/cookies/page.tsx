import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { CookiesPageView } from "@/features/home/pages/cookies-page";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.cookies.base, appUrl);
const title = "Cookie Policy";
const description = "Understand how KudosCourts uses cookies and analytics.";

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

export default function CookiesPage() {
  return <CookiesPageView />;
}
