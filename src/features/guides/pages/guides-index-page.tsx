import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEVELOPER_GUIDE_SLUG,
  type GuideEntry,
  ORG_GUIDE_SLUG,
  PLAYER_BOOKING_GUIDE_SLUG,
} from "@/features/guides/content/guides";

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
  const developerGuides = guides.filter(
    (guide) => guide.audience === "developers",
  );
  const featuredPlayerGuide =
    playerGuides.find((guide) => guide.slug === PLAYER_BOOKING_GUIDE_SLUG) ??
    playerGuides[0];
  const remainingPlayerGuides = playerGuides.filter(
    (guide) => guide.slug !== featuredPlayerGuide?.slug,
  );
  const featuredOwnerGuide =
    ownerGuides.find((guide) => guide.slug === ORG_GUIDE_SLUG) ??
    ownerGuides[0];
  const remainingOwnerGuides = ownerGuides.filter(
    (guide) => guide.slug !== featuredOwnerGuide?.slug,
  );
  const featuredDeveloperGuide =
    developerGuides.find((guide) => guide.slug === DEVELOPER_GUIDE_SLUG) ??
    developerGuides[0];
  const remainingDeveloperGuides = developerGuides.filter(
    (guide) => guide.slug !== featuredDeveloperGuide?.slug,
  );

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
            owner guides for venues that want to get found without giving up
            control, and developer integration guides for teams connecting their
            own systems to KudosCourts.
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

        {featuredPlayerGuide ? (
          <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-background p-6 shadow-2xl shadow-primary/10 md:p-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary text-primary-foreground">
                    Featured player guide
                  </Badge>
                  <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                    <BookOpen className="h-3.5 w-3.5" />
                    Start here
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(featuredPlayerGuide.updatedAt)}
                  </span>
                </div>

                <div className="max-w-3xl space-y-3">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                    <Link
                      href={appRoutes.guides.detail(featuredPlayerGuide.slug)}
                      className="transition-colors hover:text-primary"
                    >
                      {featuredPlayerGuide.title}
                    </Link>
                  </h2>
                  <p className="text-base leading-7 text-muted-foreground md:text-lg">
                    {featuredPlayerGuide.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="font-heading">
                    <Link
                      href={appRoutes.guides.detail(featuredPlayerGuide.slug)}
                    >
                      Read the booking guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="font-heading"
                  >
                    <Link href={appRoutes.courts.base}>
                      Browse courts first
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-primary/15 bg-background/80 p-5 backdrop-blur-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Quick path
                </p>
                <div className="mt-4 space-y-3">
                  {featuredPlayerGuide.relatedLinks
                    .slice(0, 3)
                    .map((link, index) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-heading text-xs text-primary/70">
                            0{index + 1}
                          </span>
                          <span>{link.label}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              More guides for players
            </h2>
            <p className="text-sm text-muted-foreground">
              Start with city and sport pages, then use court detail pages to
              compare reviews, amenities, and availability signals.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {remainingPlayerGuides.map((guide) => (
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

          {featuredOwnerGuide ? (
            <article className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-background p-6 shadow-2xl shadow-primary/10 md:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>Featured owner guide</Badge>
                    <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                      <BookOpen className="h-3.5 w-3.5" />
                      For venues
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(featuredOwnerGuide.updatedAt)}
                    </span>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                      <Link
                        href={appRoutes.guides.detail(featuredOwnerGuide.slug)}
                        className="transition-colors hover:text-primary"
                      >
                        {featuredOwnerGuide.title}
                      </Link>
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground md:text-lg">
                      {featuredOwnerGuide.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="font-heading">
                      <Link
                        href={appRoutes.guides.detail(featuredOwnerGuide.slug)}
                      >
                        Read the setup guide
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="font-heading"
                    >
                      <Link href={appRoutes.ownersGetStarted.base}>
                        List your venue
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-primary/15 bg-background/80 p-5 backdrop-blur-sm">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
                    Quick path
                  </p>
                  <div className="mt-4 space-y-3">
                    {featuredOwnerGuide.relatedLinks
                      .slice(0, 3)
                      .map((link, index) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
                        >
                          <span className="flex items-center gap-3">
                            <span className="font-heading text-xs text-primary/70">
                              0{index + 1}
                            </span>
                            <span>{link.label}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {remainingOwnerGuides.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {remainingOwnerGuides.map((guide) => (
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
          ) : null}
        </section>

        <section id="developer-guides" className="scroll-mt-24 space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Guides for developers
            </h2>
            <p className="text-sm text-muted-foreground">
              Technical walkthroughs for venue teams and external integrators
              connecting existing systems to the KudosCourts developer API.
            </p>
          </div>

          {featuredDeveloperGuide ? (
            <article className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-background p-6 shadow-2xl shadow-primary/10 md:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>Featured developer guide</Badge>
                    <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                      <BookOpen className="h-3.5 w-3.5" />
                      For integrations
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(featuredDeveloperGuide.updatedAt)}
                    </span>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                      <Link
                        href={appRoutes.guides.detail(
                          featuredDeveloperGuide.slug,
                        )}
                        className="transition-colors hover:text-primary"
                      >
                        {featuredDeveloperGuide.title}
                      </Link>
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground md:text-lg">
                      {featuredDeveloperGuide.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="font-heading">
                      <Link
                        href={appRoutes.guides.detail(
                          featuredDeveloperGuide.slug,
                        )}
                      >
                        Read the integration guide
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="font-heading"
                    >
                      <Link
                        href="/api/developer/v1/openapi.json"
                        target="_blank"
                      >
                        OpenAPI contract
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-primary/15 bg-background/80 p-5 backdrop-blur-sm">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
                    Quick path
                  </p>
                  <div className="mt-4 space-y-3">
                    {featuredDeveloperGuide.relatedLinks
                      .slice(0, 3)
                      .map((link, index) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          target={
                            link.href.startsWith("/api/") ? "_blank" : undefined
                          }
                          className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
                        >
                          <span className="flex items-center gap-3">
                            <span className="font-heading text-xs text-primary/70">
                              0{index + 1}
                            </span>
                            <span>{link.label}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {remainingDeveloperGuides.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {remainingDeveloperGuides.map((guide) => (
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
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </Container>
  );
}
