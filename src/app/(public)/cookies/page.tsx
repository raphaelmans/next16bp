import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
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
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 23, 2026
          </p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground">
          <p>
            We use cookies to keep you signed in, remember preferences, and
            measure platform performance. You can disable cookies in your
            browser, but some features may not work as expected.
          </p>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Essential cookies
            </h2>
            <p>
              These cookies enable authentication, session security, and form
              workflows. They are required for the site to function.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Analytics cookies
            </h2>
            <p>
              We may use privacy-focused analytics to understand how players and
              owners interact with the platform and improve booking flows.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
