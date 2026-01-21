"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import { useSetOwnerOnboardingIntent } from "@/shared/lib/owner-onboarding-intent";

const buildOwnerOnboardingHref = () => {
  const params = new URLSearchParams({ next: appRoutes.owner.places.new });
  return `${appRoutes.owner.onboarding}?${params.toString()}`;
};

const STEPS = [
  {
    id: "org",
    step: "Step 1 of 4",
    title: "Create your organization",
    description:
      "Set up who you are (club, sports center, or facility operator).",
    icon: Building2,
  },
  {
    id: "place",
    step: "Step 2 of 4",
    title: "Add your venue",
    description: "Add the venue name, address, city, and reservable status.",
    icon: MapPin,
  },
  {
    id: "court",
    step: "Step 3 of 4",
    title: "Add your first court",
    description:
      "Create one court now. You can configure hours and pricing later.",
    icon: BadgeCheck,
  },
  {
    id: "verify",
    step: "Step 4 of 4",
    title: "Verify to unlock bookings",
    description:
      "Upload proof of ownership and get a verified badge for players.",
    icon: ShieldCheck,
  },
];

const FAQS = [
  {
    id: "how-long",
    question: "How long does verification take?",
    answer:
      "After you submit documents, our team reviews your request and emails you when it is approved or if updates are needed.",
  },
  {
    id: "setup-later",
    question: "Can I list now and configure pricing/hours later?",
    answer:
      "Yes. The first-time onboarding focuses on the minimum setup (venue, one court, verification). You can fine-tune hours, pricing, and slots after.",
  },
  {
    id: "what-docs",
    question: "What documents should I prepare?",
    answer:
      "Upload any proof of ownership or authorization to operate the venue. Accepted formats include JPG, PNG, WebP, and PDF.",
  },
  {
    id: "already-listed",
    question: "My venue is already on KudosCourts. What should I do?",
    answer:
      'Search for your venue, open the listing, and use the "Claim this listing" option to request ownership so you can manage courts and enable bookings.',
  },
];

export default function ListYourVenuePage() {
  const onboardingHref = buildOwnerOnboardingHref();
  const signInHref = appRoutes.login.from(onboardingHref);
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  useEffect(() => {
    trackEvent({ event: "funnel.owner_list_your_venue_viewed" });
  }, []);

  const handleOnboardingStart = (source: string) => {
    setOwnerOnboardingIntent.mutate(true);
    trackEvent({
      event: "funnel.owner_list_your_venue_cta_clicked",
      properties: { source },
    });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -left-24 h-[340px] w-[340px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <span className="font-heading font-semibold text-foreground">
                  For owners
                </span>
                <span>·</span>
                <span>Venue → Court → Verification</span>
              </div>

              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                List your venue on KudosCourts
              </h1>

              <p className="text-base text-muted-foreground sm:text-lg">
                Start with the essentials today. Set up your organization, add a
                venue, create your first court, then submit verification. You
                can configure schedules, pricing, and slots after onboarding.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl">
                  <Link
                    href={onboardingHref}
                    onClick={() =>
                      handleOnboardingStart("list-your-venue.hero")
                    }
                  >
                    Start onboarding
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl"
                >
                  <a href="#verification">How verification works</a>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={signInHref}
                  className="text-accent hover:underline"
                  onClick={() =>
                    trackEvent({
                      event: "funnel.owner_list_your_venue_signin_clicked",
                      properties: { source: "list-your-venue.hero" },
                    })
                  }
                >
                  Sign in
                </Link>
              </div>
            </div>

            <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="font-heading">What you get</CardTitle>
                <CardDescription>
                  A clean path to get bookable, without a long setup wizard.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-semibold">
                      Verified badge
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Build trust with players and unlock online reservations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-semibold">
                      Discoverable venue page
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Players can find your venue and see sports and courts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-semibold">
                      Fast onboarding
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add the basics now. Configure hours/pricing later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="py-10 sm:py-14">
        <Container size="xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="mt-2 text-muted-foreground">
                Four quick steps to go from zero to verified.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              Progress: 4 steps
            </Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.id}
                  className="border-border/60 bg-card hover:border-border hover:shadow-md transition-colors"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className="text-xs">
                        {step.step}
                      </Badge>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <CardTitle className="font-heading text-lg">
                      {step.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Ready to start? We will guide you through the minimum setup.
            </p>
            <Button asChild className="rounded-xl">
              <Link
                href={onboardingHref}
                onClick={() => handleOnboardingStart("list-your-venue.steps")}
              >
                Start onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <section id="verification" className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-heading">Verification</CardTitle>
              <CardDescription>
                Verification builds trust and unlocks online reservations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">Upload</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add one or more documents (JPG, PNG, WebP, PDF).
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">Review</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our team reviews your submission and may request updates.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">Enable</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once verified, enable reservations when your venue is ready.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground">
                Quick answers before you submit your venue.
              </p>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-2">
                <Accordion type="single" collapsible>
                  {FAQS.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent className="px-1 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
