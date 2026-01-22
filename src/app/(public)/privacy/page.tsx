import type { Metadata } from "next";
import { env } from "@/lib/env";
import { Container } from "@/shared/components/layout/container";
import { appRoutes } from "@/shared/lib/app-routes";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.privacy.base, appUrl);
const title = "Privacy Policy";
const description =
  "Learn how KudosCourts collects, uses, and protects your information.";

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

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 23, 2026
          </p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground">
          <p>
            We collect only the information needed to help players request
            bookings and to allow venue owners to manage their listings.
          </p>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Information we collect
            </h2>
            <p>
              This includes contact details you provide, booking details, and
              basic analytics to improve the experience. We do not store payment
              credentials.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              How we use information
            </h2>
            <p>
              Data is used to fulfill booking requests, communicate with venue
              owners, and improve platform performance. We do not sell your
              personal data.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Your choices
            </h2>
            <p>
              You can request access, updates, or deletion of your data by
              contacting us. We will respond within a reasonable timeframe.
            </p>
          </div>

          <p>
            For questions, please reach out through the contact page and we will
            help.
          </p>
        </div>
      </div>
    </Container>
  );
}
