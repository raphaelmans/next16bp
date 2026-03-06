import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { BlogPageView } from "@/features/home/pages/blog-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.blog.base, appUrl);
const title = "KudosCourts Blog";
const description =
  "Pickleball tips, court reviews, and venue spotlights from the Philippines' sports court platform.";

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

export default function BlogPage() {
  return <BlogPageView />;
}
