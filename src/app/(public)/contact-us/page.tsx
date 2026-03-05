import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { ContactUsPageView } from "@/features/contact/pages/contact-us-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

const appUrl = getCanonicalOrigin();
const canonicalUrl = new URL(appRoutes.contactUs.base, appUrl);
const title = "Contact KudosCourts";
const description =
  "Reach the KudosCourts team for venue partnerships, support, or booking questions in the Philippines.";

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

export default function ContactUsPage() {
  return <ContactUsPageView />;
}
