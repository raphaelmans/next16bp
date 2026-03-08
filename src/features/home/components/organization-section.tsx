"use client";

import { ArrowUpRight, Building2, MapPinPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrganizationSectionProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isLoading?: boolean;
}

export function OrganizationSection({
  organization,
  isLoading,
}: OrganizationSectionProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="gap-4">
          <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
          <div className="space-y-3">
            <div className="h-8 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-11 animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const highlights = organization
    ? ["Add a new location", "Reviewed before publish", "Manage from one place"]
    : ["Suggest a venue", "We verify listings", "Keep the directory useful"];

  const description = organization
    ? `Add another location for ${organization.name}. We'll review it before it goes live.`
    : "Know a great court or sports center? Submit it and we'll review it before it appears on Kudos.";

  const supportingCopy = organization
    ? "New locations are reviewed before publication so your live listings stay clean."
    : "Submissions are reviewed so the directory stays accurate for everyone.";

  return (
    <Card className="group relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.10] via-background to-amber-500/[0.12] shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.18),transparent_34%)]" />
      <div className="pointer-events-none absolute right-5 bottom-5 h-24 w-24 rounded-full border border-primary/15 bg-background/40 blur-2xl" />
      <CardHeader className="relative gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="border-primary/20 bg-background/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary"
            >
              {organization ? "Your Organization" : "Suggest a Venue"}
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-balance">
                Add a venue
              </CardTitle>
              <CardDescription className="max-w-sm text-sm leading-6 text-foreground/72">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="relative hidden shrink-0 sm:block">
            <div className="flex size-16 items-center justify-center rounded-[1.4rem] border border-primary/20 bg-background/80 shadow-sm shadow-primary/10">
              <MapPinPlus className="size-7 text-primary" />
            </div>
            <div className="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full border border-border/70 bg-card shadow-sm">
              <Building2 className="size-3.5 text-foreground/80" />
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs font-medium tracking-wide text-foreground/75 backdrop-blur"
            >
              {highlight}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-4 shadow-sm shadow-black/5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {organization ? organization.name : "Kudos Directory"}
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground/72">
            {supportingCopy}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="h-11 w-full rounded-xl shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5"
            asChild
          >
            <Link href={appRoutes.submitVenue.base}>
              Add a venue
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          {organization ? (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-border/70 bg-background/75"
              asChild
            >
              <Link href={appRoutes.organization.base}>Open dashboard</Link>
            </Button>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            Submissions are reviewed before they appear publicly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
