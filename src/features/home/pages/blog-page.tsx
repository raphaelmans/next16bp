import { Container } from "@/components/layout/container";

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
          We&apos;re preparing our first articles. Check back for tips on court
          discovery, venue management, and community highlights.
        </div>
      </div>
    </Container>
  );
}
