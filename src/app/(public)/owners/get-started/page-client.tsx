"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle,
  ClipboardList,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { useSetOwnerOnboardingIntent } from "@/common/hooks/owner-onboarding-intent";
import { Container } from "@/components/layout";
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

const buildOwnerRegisterHref = () => {
  const params = new URLSearchParams({ redirect: appRoutes.owner.getStarted });
  return `${appRoutes.register.owner}?${params.toString()}`;
};

const STEPS = [
  {
    id: "account",
    step: "Step 1",
    title: "Create your owner account",
    description:
      "Sign up with your email or Google account to access the owner dashboard.",
    icon: Building2,
  },
  {
    id: "venue",
    step: "Step 2",
    title: "Add or claim your venue",
    description:
      "Create a new venue listing or claim an existing one that matches your facility.",
    icon: MapPin,
  },
  {
    id: "verify",
    step: "Step 3",
    title: "Submit verification",
    description:
      "Upload proof of ownership to get verified and unlock online reservations.",
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
    id: "what-docs",
    question: "What documents should I prepare?",
    answer:
      "Upload any proof of ownership or authorization to operate the venue. Accepted formats include JPG, PNG, WebP, and PDF.",
  },
  {
    id: "already-listed",
    question: "My venue is already on KudosCourts. What should I do?",
    answer:
      "Use the claim option in the owner setup hub to find your venue and request ownership so you can manage courts and enable bookings.",
  },
  {
    id: "when-bookings",
    question: "When will players be able to book?",
    answer:
      "You control when bookings start. After verification, enable reservations in your venue settings when you are ready to accept bookings.",
  },
  {
    id: "import-bookings",
    question: "Can I import my existing bookings?",
    answer:
      "Yes. You can import bookings from ICS, CSV, or XLSX files to block those time slots and prevent double-bookings.",
  },
];

export default function OwnersGetStartedPage() {
  const registerHref = buildOwnerRegisterHref();
  const loginHref = appRoutes.login.from(appRoutes.owner.getStarted);
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  useEffect(() => {
    trackEvent({ event: "funnel.owner_get_started_viewed" });
  }, []);

  const handleCtaClick = (source: string) => {
    setOwnerOnboardingIntent.mutate(true);
    trackEvent({
      event: "funnel.owner_get_started_cta_clicked",
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
                  For venue owners
                </span>
                <span>-</span>
                <span>Free to list</span>
              </div>

              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Get your venue bookable on KudosCourts
              </h1>

              <p className="text-base text-muted-foreground sm:text-lg">
                Create an owner account, add or claim your venue, and submit
                verification. You control when bookings go live.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl">
                  <Link
                    href={registerHref}
                    onClick={() => handleCtaClick("hero")}
                  >
                    Create owner account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl"
                >
                  <a href="#claim">
                    <Search className="h-4 w-4" />
                    Claim existing listing
                  </a>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={loginHref}
                  className="text-accent hover:underline"
                  onClick={() =>
                    trackEvent({
                      event: "funnel.owner_get_started_signin_clicked",
                      properties: { source: "hero" },
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
                  Everything you need to accept online reservations.
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
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-semibold">
                      Reservation management
                    </p>
                    <p className="text-sm text-muted-foreground">
                      View and manage bookings from a single dashboard.
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
                Three steps to get your venue bookable.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              3 steps
            </Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
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
              Ready to start? Create your owner account in minutes.
            </p>
            <Button asChild className="rounded-xl">
              <Link href={registerHref} onClick={() => handleCtaClick("steps")}>
                Create owner account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <section id="claim" className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-heading">
                Already see your venue listed?
              </CardTitle>
              <CardDescription>
                Claim ownership to manage courts, pricing, and enable
                reservations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">
                  1. Find your venue
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search for your venue in the owner setup hub.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">
                  2. Submit claim
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Request ownership with proof of authorization.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">
                  3. Get approved
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once approved, manage courts and enable bookings.
                </p>
              </div>
            </CardContent>
          </Card>
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      You control timing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Verification does not automatically turn on reservations.
                      You decide when to go live.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      Quick review process
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews submissions promptly and contacts you if
                      additional info is needed.
                    </p>
                  </div>
                </div>
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
                Quick answers before you get started.
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

      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Ready to get started?
              </h2>
              <p className="max-w-md text-muted-foreground">
                Create your owner account and set up your venue in minutes.
              </p>
              <Button asChild size="lg" className="rounded-xl">
                <Link
                  href={registerHref}
                  onClick={() => handleCtaClick("footer")}
                >
                  Create owner account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}
