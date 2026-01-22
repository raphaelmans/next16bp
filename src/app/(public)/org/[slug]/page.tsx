import { Building2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PlaceCard } from "@/shared/components/kudos";
import { BentoGrid, BentoItem } from "@/shared/components/layout/bento-grid";
import { Container } from "@/shared/components/layout/container";
import { PublicShell } from "@/shared/components/layout/public-shell";
import { createServerCaller } from "@/shared/infra/trpc/server";
import { appRoutes } from "@/shared/lib/app-routes";

type Props = {
  params: Promise<{ slug: string }>;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const caller = await createServerCaller(`/org/${slug}`);
    const result = await caller.organization.getBySlug({ slug });
    const description = result.profile?.description ?? undefined;

    return {
      title: result.organization.name,
      description,
      alternates: {
        canonical: `/org/${slug}`,
      },
    };
  } catch {
    return {
      title: "Organization",
      alternates: {
        canonical: `/org/${slug}`,
      },
    };
  }
}

export default async function OrgSlugPage({ params }: Props) {
  const { slug } = await params;

  try {
    const caller = await createServerCaller(`/org/${slug}`);
    const landing = await caller.organization.getLandingBySlug({ slug });

    const orgInitials = getInitials(landing.organization.name);
    const topSports = landing.stats.topSports;
    const hasVenues = landing.places.length > 0;

    return (
      <PublicShell>
        <section className="relative overflow-hidden py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
          </div>

          <Container>
            <BentoGrid cols={12} className="items-stretch">
              <BentoItem colSpanSm={4} colSpanMd={8} colSpan={7}>
                <Card className="h-full overflow-hidden border-border/60 bg-card/70 shadow-sm backdrop-blur">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
                        {landing.profile?.logoUrl ? (
                          <Image
                            src={landing.profile.logoUrl}
                            alt={`${landing.organization.name} logo`}
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-heading text-sm font-bold text-foreground">
                              {orgInitials}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Organization
                        </p>
                        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                          {landing.organization.name}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                          {landing.profile?.description ??
                            "Explore our venues, see what sports we host, and book your next game in minutes."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button asChild className="font-heading">
                        <a href="#venues">View Venues</a>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="font-heading"
                      >
                        <Link href={appRoutes.courts.base}>Browse Courts</Link>
                      </Button>
                    </div>

                    {(landing.profile?.contactEmail ||
                      landing.profile?.contactPhone ||
                      landing.profile?.address) && (
                      <div className="mt-6 grid gap-2 text-sm">
                        {landing.profile?.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            <span className="text-muted-foreground">
                              {landing.profile.address}
                            </span>
                          </div>
                        )}
                        {landing.profile?.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <a
                              href={`mailto:${landing.profile.contactEmail}`}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {landing.profile.contactEmail}
                            </a>
                          </div>
                        )}
                        {landing.profile?.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <a
                              href={`tel:${landing.profile.contactPhone}`}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {landing.profile.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </BentoItem>

              <BentoItem colSpanSm={4} colSpanMd={8} colSpan={5}>
                <Card className="h-full border-border/60 bg-card/70 shadow-sm backdrop-blur">
                  <CardHeader className="pb-0">
                    <CardTitle className="font-heading text-lg">
                      At a Glance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Venues
                        </p>
                        <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                          {landing.stats.venueCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Courts
                        </p>
                        <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                          {landing.stats.totalCourts}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Cities
                        </p>
                        <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                          {landing.stats.cityCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Verified
                        </p>
                        <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                          {landing.stats.verifiedVenueCount}
                        </p>
                      </div>
                    </div>

                    {topSports.length > 0 && (
                      <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <p className="font-heading text-xs font-semibold text-foreground">
                            Top Sports
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {topSports.map((sport) => (
                            <Badge
                              key={sport.id}
                              variant="outline"
                              className="gap-1"
                            >
                              {sport.name}
                              <span className="text-muted-foreground">
                                {sport.count}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </BentoItem>
            </BentoGrid>
          </Container>
        </section>

        <section id="venues" className="py-10 sm:py-14">
          <Container>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Our Venues
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse venues, check sports and pricing, then book a schedule.
                </p>
              </div>
              {hasVenues && (
                <Button asChild variant="outline" className="font-heading">
                  <Link href={appRoutes.courts.base}>Browse All Courts</Link>
                </Button>
              )}
            </div>

            <div className="mt-6">
              {!hasVenues ? (
                <Card className="border-border/60">
                  <CardContent className="p-0">
                    <EmptyState
                      title="No venues listed yet"
                      description="Check back soon, or browse other courts on KudosCourts."
                      action={{
                        label: "Browse Courts",
                        href: appRoutes.courts.base,
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <BentoGrid cols={12} className="items-stretch">
                  {landing.places.map((place, index) => {
                    const isFeatured = index === 0 && landing.places.length > 1;

                    return (
                      <BentoItem
                        key={place.id}
                        colSpanSm={4}
                        colSpanMd={isFeatured ? 8 : 4}
                        colSpan={isFeatured ? 8 : 4}
                        rowSpan={isFeatured ? 2 : 1}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <PlaceCard
                          place={place}
                          variant={isFeatured ? "featured" : "default"}
                        />
                      </BentoItem>
                    );
                  })}
                </BentoGrid>
              )}
            </div>
          </Container>
        </section>

        <section className="py-10 sm:py-14">
          <Container>
            <BentoGrid cols={12}>
              <BentoItem colSpanSm={4} colSpanMd={8} colSpan={7}>
                <Card className="h-full border-border/60">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">
                      Sports & Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topSports.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {topSports.map((sport) => (
                          <Badge key={sport.id} variant="outline">
                            {sport.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sports will appear here once venues are listed.
                      </p>
                    )}

                    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                      Look for the{" "}
                      <span className="font-medium text-foreground">
                        Verified
                      </span>{" "}
                      badge on venues to know reservations are enabled.
                    </div>
                  </CardContent>
                </Card>
              </BentoItem>

              <BentoItem colSpanSm={4} colSpanMd={8} colSpan={5}>
                <Card className="h-full border-border/60">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {landing.profile?.contactEmail ? (
                      <a
                        href={`mailto:${landing.profile.contactEmail}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="truncate">
                          {landing.profile.contactEmail}
                        </span>
                      </a>
                    ) : null}
                    {landing.profile?.contactPhone ? (
                      <a
                        href={`tel:${landing.profile.contactPhone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="truncate">
                          {landing.profile.contactPhone}
                        </span>
                      </a>
                    ) : null}
                    {landing.profile?.address ? (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{landing.profile.address}</span>
                      </div>
                    ) : null}

                    {!landing.profile?.contactEmail &&
                      !landing.profile?.contactPhone &&
                      !landing.profile?.address && (
                        <p className="text-muted-foreground">
                          Contact details will appear here once the organization
                          profile is filled out.
                        </p>
                      )}

                    {landing.stats.verifiedVenueCount > 0 && (
                      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3">
                        <ShieldCheck className="h-4 w-4 text-success" />
                        <span className="text-muted-foreground">
                          {landing.stats.verifiedVenueCount} verified venue
                          {landing.stats.verifiedVenueCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </BentoItem>
            </BentoGrid>
          </Container>
        </section>

        <section className="py-16 sm:py-20 bg-primary">
          <Container>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
                Ready to play?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Browse courts nearby or jump straight into a venue schedule.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-14 px-10 rounded-xl font-heading font-semibold text-primary"
                >
                  <Link href={appRoutes.courts.base}>Browse Courts</Link>
                </Button>
                {hasVenues && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 rounded-xl border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-heading"
                  >
                    <a href="#venues">View Venues</a>
                  </Button>
                )}
              </div>
            </div>
          </Container>
        </section>
      </PublicShell>
    );
  } catch {
    return notFound();
  }
}
