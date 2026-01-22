import type { Metadata } from "next";
import { env } from "@/lib/env";
import { Container } from "@/shared/components/layout/container";
import { appRoutes } from "@/shared/lib/app-routes";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.terms.base, appUrl);
const title = "Terms of Service";
const description =
  "Review the KudosCourts terms covering booking requests, payments, and platform guidelines.";

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

export default function TermsPage() {
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 23, 2026
          </p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground">
          <p>
            KudosCourts is a discovery and reservation platform that connects
            players with venue owners. We do not process payments or facilitate
            direct messaging between players and owners.
          </p>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Booking requests
            </h2>
            <p>
              Bookings are requests until the venue owner confirms the
              reservation. Availability, pricing, and acceptance windows are
              managed by the venue owner.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Payments and liability
            </h2>
            <p>
              Any payments are made directly between players and venue owners.
              KudosCourts does not verify payments and is not responsible for
              disputes or refunds.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Acceptable use
            </h2>
            <p>
              You agree to provide accurate information and use the platform for
              legitimate reservations. Abuse, fraud, or unauthorized access may
              result in suspension.
            </p>
          </div>

          <p>
            Questions about these terms? Reach out via the contact page and our
            team will help.
          </p>
        </div>
      </div>
    </Container>
  );
}
