import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { GUIDE_ENTRIES } from "@/features/guides/content/guides";
import { GuidesIndexPage } from "@/features/guides/pages/guides-index-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.guides.base, appUrl);
const title = "Guides for Finding Sports Courts in the Philippines";
const description =
  "Player-first court-finding guides for Philippine cities and sports, plus owner guides for venues that want to get found without losing control.";

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

export default function GuidesPage() {
  return <GuidesIndexPage guides={GUIDE_ENTRIES} />;
}
