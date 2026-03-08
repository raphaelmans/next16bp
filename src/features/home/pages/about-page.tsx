import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function AboutPageView() {
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Company
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            About KudosCourts
          </h1>
          <p className="text-muted-foreground">
            KudosCourts is a player-first discovery platform built to make
            sports courts across the Philippines easier to find, compare, and
            trust.
          </p>
        </div>

        <div className="space-y-7 text-sm text-muted-foreground">
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Why we built it
            </h2>
            <p>
              Finding a court in the Philippines often means bouncing between
              Facebook pages, old posts, separate reservation sites, and direct
              messages. Players waste time just trying to figure out which
              courts are active, where they are, and whether they are worth the
              trip.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              What we do
            </h2>
            <p>
              We help players discover courts by city, sport, reviews,
              amenities, and availability when venues manage it. For venue
              owners, KudosCourts adds visibility without taking control away.
              Owners keep their listing, pricing, payment methods, and
              operations.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              How the platform works
            </h2>
            <p>
              KudosCourts is designed as a discovery platform, not a
              marketplace. We connect players to venues and surface the details
              they need to make a decision. When venues want to manage
              availability or reservations through the platform, they can do
              that without giving up control of the business.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="font-heading">
              <Link href={appRoutes.ownersGetStarted.base}>
                List your venue — free for venues
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-heading">
              <Link href={appRoutes.courts.base}>Browse courts</Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
