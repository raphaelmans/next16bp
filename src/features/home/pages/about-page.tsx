import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function AboutPageView() {
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
            KudosCourts is built to make sports court reservations
            accessible—especially for small and newly opened venues that still
            manage bookings in spreadsheets, notebooks, and DMs.
          </p>
        </div>

        <div className="space-y-7 text-sm text-muted-foreground">
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Why we built it
            </h2>
            <p>
              Many venues still handle bookings with calendars, spreadsheets,
              and DMs—not because they prefer it, but because reservation
              software has historically been expensive or required custom work.
              That leads to double bookings, confusion, and constant
              back-and-forth.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              What we do
            </h2>
            <p>
              We help players discover courts and see real availability. For
              venue owners, KudosCourts is a free reservation system with
              verification to build trust and built-in chat so players and
              venues can coordinate. We do not process payments—venues keep
              their existing payment methods and players pay venues directly.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              How we stay free
            </h2>
            <p>
              We plan to monetize through advertising and sponsored placements,
              not by charging venues or players upfront. The goal is to keep the
              core system accessible while building something sustainable.
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
