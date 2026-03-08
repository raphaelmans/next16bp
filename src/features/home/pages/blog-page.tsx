import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function BlogPageView() {
  return (
    <Container className="py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Updates
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            KudosCourts Blog
          </h1>
          <p className="text-muted-foreground">
            Stories, launch notes, and play guides are coming soon.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          We&apos;re preparing our first articles. Check back for tips on
          finding courts, venue management, and community highlights.
        </div>

        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6">
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Start with our guides
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;re publishing player-first court-finding guides under a
              dedicated guides section before we open the broader blog archive.
            </p>
            <Button asChild variant="outline" className="font-heading">
              <Link href={appRoutes.guides.base}>Browse guides</Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
