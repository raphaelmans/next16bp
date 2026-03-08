import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GuideEntry } from "@/features/guides/content/guides";

type GuidesIndexPageProps = {
  guides: GuideEntry[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function GuidesIndexPage({ guides }: GuidesIndexPageProps) {
  const playerGuides = guides.filter((guide) => guide.audience === "players");
  const ownerGuides = guides.filter((guide) => guide.audience === "owners");

  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Guides
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            Player-first court-finding guides for the Philippines
          </h1>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            Practical guides for players looking for courts by city and sport,
            plus a smaller set of owner guides for venues that want to get found
            without giving up control.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="font-heading">
              <Link href={appRoutes.courts.base}>Browse courts</Link>
            </Button>
            <Button asChild variant="outline" className="font-heading">
              <Link href={appRoutes.ownersGetStarted.base}>
                List your venue
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Guides for players
            </h2>
            <p className="text-sm text-muted-foreground">
              Start with city and sport pages, then use court detail pages to
              compare reviews, amenities, and availability signals.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {playerGuides.map((guide) => (
              <article
                key={guide.slug}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{guide.heroEyebrow}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(guide.updatedAt)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-semibold tracking-tight">
                      <Link
                        href={appRoutes.guides.detail(guide.slug)}
                        className="hover:text-primary"
                      >
                        {guide.title}
                      </Link>
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {guide.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {guide.relatedLinks.slice(0, 2).map((link) => (
                      <Button
                        key={link.href}
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="owner-guides" className="scroll-mt-24 space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Guides for venue owners
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep the listing, pricing, and operational decisions in your hands
              while making the venue easier for players to find.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {ownerGuides.map((guide) => (
              <article
                key={guide.slug}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge>{guide.heroEyebrow}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(guide.updatedAt)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-semibold tracking-tight">
                      <Link
                        href={appRoutes.guides.detail(guide.slug)}
                        className="hover:text-primary"
                      >
                        {guide.title}
                      </Link>
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {guide.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {guide.relatedLinks.slice(0, 2).map((link) => (
                      <Button
                        key={link.href}
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
