import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";
const canonicalUrl = new URL(appRoutes.about.base, appUrl);
const title = "About KudosCourts";
const description =
  "KudosCourts is a player-first platform for discovering courts and reserving time with trusted venue owners.";

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

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Company
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            About KudosCourts
          </h1>
          <p className="text-muted-foreground">
            A unified way to discover courts, verify venues, and reserve play
            time in minutes.
          </p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground">
          <p>
            KudosCourts is built for players who want clarity and speed when
            finding courts, and for owners who need lightweight tools to manage
            availability and reservations.
          </p>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Player-first discovery
            </h2>
            <p>
              Browse venues by sport, location, and amenities, then see real
              availability before you commit.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Trusted venues
            </h2>
            <p>
              Verified venue owners can unlock bookings, giving players a
              reliable and consistent reservation experience.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
