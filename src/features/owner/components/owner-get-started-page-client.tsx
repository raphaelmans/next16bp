"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  ClipboardList,
  LayoutGrid,
  MapPin,
  MessageSquare,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Upload,
  UserPlus,
  Users,
  Wallet,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  OWNER_GET_STARTED_FAQS,
  OWNER_GET_STARTED_LAST_UPDATED_LABEL,
} from "@/features/owner/constants/owner-get-started-faq";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const buildOwnerRegisterHref = () => {
  const params = new URLSearchParams({
    redirect: appRoutes.organization.getStarted,
  });
  return `${appRoutes.register.owner}?${params.toString()}`;
};

const PROOF_STATS = [
  { value: "$0", label: "Essentials" },
  { value: "P2P", label: "Direct Payments" },
  { value: "~5 min", label: "Setup Time" },
];

const PAIN_POINTS = [
  {
    id: "dms",
    emoji: "💬",
    title: "Bookings come through DMs and calls",
    description:
      "Scattered across Messenger, Viber, and group chats. No single source of truth.",
  },
  {
    id: "spreadsheets",
    emoji: "📋",
    title: "Spreadsheets and Google Calendar",
    description:
      "You track reservations across notebooks and shared calendars — and double-bookings still happen.",
  },
  {
    id: "rates",
    emoji: "🔄",
    title: "Rates & policies get lost in chat",
    description:
      "Pricing changes, peak-hour rules, and cancellation policies buried in old threads.",
  },
  {
    id: "expensive",
    emoji: "💸",
    title: '"Going digital" is expensive',
    description:
      "Software built for someone else's business. Too complicated, too costly for your setup.",
  },
];

const RESERVATION_FLOWS = [
  {
    id: "free",
    label: "Free Venue",
    steps: ["Pending", "You Accept", "Confirmed"],
    description:
      "A player finds your venue and requests a booking. You tap Accept — done. Confirmed instantly. No payment step because the venue is free.",
    highlight:
      "You have a 45-minute window to accept or reject. If you don't respond, the request expires and the slot opens back up.",
  },
  {
    id: "paid",
    label: "Paid (Online)",
    steps: ["Pending", "Awaiting Payment", "Payment Marked", "Confirmed"],
    description:
      "You accept the request, starting a 45-minute payment window. The player pays you directly (GCash, Maya, bank) and marks it in-app. You tap Confirm Payment to finalize.",
    highlight:
      "Every step is timed. If the player doesn't pay in time, the reservation expires and the slot reopens. No manual cleanup.",
  },
  {
    id: "offline",
    label: "Paid (Offline)",
    steps: ["Pending", "Confirm Paid Offline", "Confirmed"],
    description:
      "The player already paid you directly — cash, GCash, or bank transfer outside the app. Tap Confirm Paid Offline in one action. Jumps straight to confirmed.",
    highlight:
      "For your suki, walk-ins who already paid, or anyone who handles payment through your traditional channels.",
  },
  {
    id: "guest",
    label: "Guest Booking",
    steps: ["You Create Booking", "Confirmed"],
    description:
      "A regular calls or shows up. Open the Availability Studio, pick the time, select their guest profile — immediately confirmed. No app needed on their end.",
    highlight:
      "Guest bookings keep your schedule accurate for all customers — not just those who use the app.",
  },
];

const STUDIO_BLOCKS = [
  {
    id: "available",
    label: "Available",
    color: "bg-success-light text-success border-dashed border-success/20",
    dotColor: "bg-success",
    description:
      "Open time players can book through the platform. Pricing uses your hourly rate rules. Updates in real-time.",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    color: "bg-muted/60 text-muted-foreground border-border",
    dotColor: "bg-muted-foreground/60",
    description:
      "Block off time for repairs, cleaning, or private events. Players can't book these slots.",
  },
  {
    id: "walkin",
    label: "Walk-in",
    color: "bg-warning/5 text-warning border-dashed border-warning/15",
    dotColor: "bg-warning/50",
    description:
      "Reserve time for walk-in customers. When someone shows up and pays, convert the block into a confirmed guest booking with one tap.",
  },
  {
    id: "guest",
    label: "Guest Booking",
    color: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning/70",
    description:
      "A confirmed reservation you created directly for a customer. Perfect for regulars, phone bookings, or anyone who pays through traditional channels.",
  },
  {
    id: "booked",
    label: "Booked",
    color: "bg-warning/15 text-warning-foreground border-warning/25",
    dotColor: "bg-warning",
    description:
      "A player booked this slot through the app. The booking went through the full flow — request, acceptance, payment confirmation.",
  },
];

const GUEST_SCENARIOS = [
  {
    id: "suki",
    emoji: "📞",
    title: "Suki calls to reserve",
    description:
      "Your regular calls or messages. They pay you like they always have.",
    steps: [
      "Open the Availability Studio and pick the time slot",
      "Select their guest profile (or create one — name, phone, email)",
      "Booking is immediately confirmed. No app needed on their end.",
      "They pay you directly through your usual channels. Done.",
    ],
  },
  {
    id: "walkin",
    emoji: "🚶",
    title: "Walk-in arrives",
    description:
      "Someone shows up at your venue. You already have a walk-in block set.",
    steps: [
      "You already have a walk-in block on the timeline for this hour",
      "Customer arrives and pays at the counter",
      'Tap the walk-in block → "Convert to guest booking"',
      "Select existing profile or create a new one. Block becomes a confirmed reservation.",
    ],
  },
  {
    id: "new-walkin",
    emoji: "✨",
    title: "New walk-in, no block",
    description: "First-time customer walks in. No pre-set block needed.",
    steps: [
      "Open the Availability Studio and pick an open slot",
      'Choose "Guest booking" and enter their name',
      "Booking created and confirmed in one step. Profile saved for next time.",
    ],
  },
];

const FREE_FEATURES = [
  {
    id: "reservations",
    title: "Reservation Inbox",
    description: "Accept, reject, and confirm all bookings from one dashboard.",
    icon: ClipboardList,
    color: "primary" as const,
  },
  {
    id: "studio",
    title: "Availability Studio",
    description:
      "Visual block editor for your schedule — available slots, maintenance, walk-ins, and guest bookings.",
    icon: LayoutGrid,
    color: "primary" as const,
  },
  {
    id: "guest-profiles",
    title: "Guest Profiles",
    description:
      "Save profiles for your suki and walk-ins. Reuse every time they book.",
    icon: Users,
    color: "primary" as const,
  },
  {
    id: "court-mgmt",
    title: "Venue Management",
    description:
      "Day-specific hours, hourly pricing rules, and amenities per venue.",
    icon: Settings,
    color: "muted" as const,
  },
  {
    id: "p2p",
    title: "P2P Payments",
    description:
      "Players pay you directly — GCash, Maya, bank, cash. No middleman.",
    icon: Wallet,
    color: "primary" as const,
  },
  {
    id: "verified",
    title: "Verified Badge",
    description: "Build trust with players through a verified badge.",
    icon: ShieldCheck,
    color: "primary" as const,
  },
  {
    id: "team-access",
    title: "Team Access",
    description:
      "Invite managers and staff. Assign roles and permissions — control who sees and does what.",
    icon: UserPlus,
    color: "primary" as const,
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "In-app inbox, web push, mobile push, email, and SMS — per user, per venue.",
    icon: Bell,
    color: "primary" as const,
  },
  {
    id: "qr",
    title: "QR Code",
    description:
      "Generate a QR for your venue. Walk-ins scan and book on the spot.",
    icon: QrCode,
    color: "muted" as const,
  },
];

const BETA_FEATURES = [
  {
    id: "imports",
    title: "Booking Imports",
    description:
      "Migrate from CSV, Excel, iCal, or screenshots. AI-powered data mapping.",
    icon: Upload,
    badge: "Beta",
  },
  {
    id: "chat",
    title: "In-App Chat",
    description: "Message players inside the booking context.",
    icon: MessageSquare,
    badge: "Beta",
  },
];

const STEPS = [
  {
    id: "org",
    step: "1",
    title: "Create your organization",
    description:
      "Name, logo, and contact details. Manage multiple venues under one account.",
    icon: Building2,
  },
  {
    id: "venue",
    step: "2",
    title: "Add or claim your venue",
    description:
      "Create a new listing or claim an existing one on KudosCourts.",
    icon: MapPin,
  },
  {
    id: "verify",
    step: "3",
    title: "Get verified",
    description:
      "Submit proof of ownership. Once approved, you get a verified badge.",
    icon: ShieldCheck,
  },
  {
    id: "go-live",
    step: "4",
    title: "Configure courts & go live",
    description:
      "Set hours, pricing, and amenities. Publish availability — players book immediately.",
    icon: Settings,
  },
];

const PERKS = [
  {
    id: "featured",
    emoji: "📍",
    title: "3 months featured placement",
    description:
      "Top visibility in your city's search rankings. Players see you first.",
  },
  {
    id: "support",
    emoji: "🤝",
    title: "Dedicated hands-on support",
    description:
      "We work closely with you to ensure reliability. Your feedback shapes the platform directly.",
  },
];

const HEATMAP_CELLS = [
  [20, 30, 50, 40, 60, 80, 90],
  [10, 25, 45, 55, 70, 85, 75],
  [15, 35, 60, 50, 75, 95, 80],
].flatMap((row, ri) => row.map((v, ci) => ({ key: `r${ri}c${ci}`, v })));

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  muted: { bg: "bg-muted", text: "text-foreground" },
};

// ---------------------------------------------------------------------------
// Timeline helpers
// ---------------------------------------------------------------------------

const TIMELINE_SLOTS = [
  { hour: "8 AM", type: "available", label: "Open slot" },
  { hour: "9 AM", type: "booked", label: "Juan D. — Basketball" },
  { hour: "10 AM", type: "maintenance", label: "Floor cleaning" },
  { hour: "11 AM", type: "available", label: "Open slot" },
  { hour: "12 PM", type: "walkin", label: "Reserved for walk-ins" },
  { hour: "1 PM", type: "walkin", label: "Reserved for walk-ins" },
  { hour: "2 PM", type: "guest", label: "Maria S. (suki)" },
  { hour: "3 PM", type: "available", label: "Open slot" },
  { hour: "4 PM", type: "booked", label: "Mark R. — Badminton" },
  { hour: "5 PM", type: "available", label: "Open slot" },
];

const slotStyles: Record<string, string> = {
  available: "bg-success-light border-dashed border-success/20 text-success",
  booked: "bg-warning/15 border-warning/25 text-warning-foreground",
  maintenance: "bg-muted/60 border-border text-muted-foreground",
  walkin: "bg-warning/5 border-dashed border-warning/15 text-warning",
  guest: "bg-warning/10 border-warning/20 text-warning",
};

const slotBadgeStyles: Record<string, string> = {
  available: "bg-success-light text-success",
  booked: "bg-warning/15 text-warning-foreground",
  maintenance: "bg-muted text-muted-foreground",
  walkin: "bg-warning/5 text-warning",
  guest: "bg-warning/10 text-warning",
};

const slotBadgeLabels: Record<string, string> = {
  available: "Available",
  booked: "Booked",
  maintenance: "Maintenance",
  walkin: "Walk-in",
  guest: "Guest",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OwnersGetStartedPage() {
  const registerHref = buildOwnerRegisterHref();
  const loginHref = appRoutes.login.from(appRoutes.organization.getStarted);
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
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -left-24 h-[340px] w-[340px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* HERO                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <span className="font-heading font-semibold text-foreground">
                For venue owners
              </span>
              <span>-</span>
              <span>Free reservation system</span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Your venue is already being searched for.
            </h1>

            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Players are already searching for available venues in your city.
              List or claim your venue, manage booking requests, and keep your
              schedule up to date with{" "}
              <strong className="text-foreground">
                free core reservation tools.
              </strong>
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-12 rounded-xl">
                <Link
                  href={registerHref}
                  onClick={() => handleCtaClick("hero")}
                >
                  Create free owner account
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

            <Link
              href={appRoutes.guides.detail(
                "how-to-set-up-your-sports-venue-organization-on-kudoscourts",
              )}
              className="group mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
            >
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  New to KudosCourts?
                </p>
                <p className="text-xs text-muted-foreground">
                  Read the step-by-step setup guide
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>

            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={loginHref}
                className="text-primary hover:underline"
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

          {/* Proof stats */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6 sm:gap-10">
            {PROOF_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex items-center gap-6 sm:gap-10"
              >
                {i > 0 && <div className="h-8 w-px bg-border/60" />}
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* PAIN POINTS                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Sound familiar?
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              You already know how it goes.
            </h2>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map((pain) => (
              <div
                key={pain.id}
                className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-5"
              >
                <span className="text-2xl" role="img" aria-hidden>
                  {pain.emoji}
                </span>
                <div className="space-y-1">
                  <p className="font-heading text-sm font-semibold">
                    {pain.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pain.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center font-heading text-lg font-semibold tracking-tight">
            Your venues deserve better. Your players deserve better.
          </p>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FREE FEATURES                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="flex flex-col gap-3 text-center">
            <Badge
              variant="outline"
              className="mx-auto w-fit border-primary/30 bg-primary/5 text-primary"
            >
              Free essentials
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              The essentials to run your venues — free
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Accept bookings, manage your schedule, bring your team on board,
              and coordinate with players. No subscription required for the
              essentials.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_FEATURES.map((feat) => {
              const Icon = feat.icon;
              const colors = colorMap[feat.color];
              return (
                <Card
                  key={feat.id}
                  className="border-border/60 bg-card hover:border-border hover:shadow-md transition-all"
                >
                  <CardHeader className="space-y-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="font-heading text-base">
                      {feat.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {feat.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Beta features row */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {BETA_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="flex items-start gap-3 rounded-xl border border-dashed border-border/60 bg-card/50 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-sm font-semibold">
                        {feat.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        {feat.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* RESERVATION FLOWS                                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Reservation system
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Flexible, not rigid.
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              The system adapts to how you actually operate. Four booking
              scenarios — each with a clear flow.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <Tabs defaultValue="free">
              <TabsList className="mx-auto flex w-full flex-wrap sm:w-fit">
                {RESERVATION_FLOWS.map((flow) => (
                  <TabsTrigger key={flow.id} value={flow.id}>
                    {flow.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {RESERVATION_FLOWS.map((flow) => (
                <TabsContent key={flow.id} value={flow.id}>
                  <Card className="mt-4 border-border/60">
                    <CardContent className="space-y-4 p-5 sm:p-6">
                      {/* Step diagram */}
                      <div className="flex flex-wrap items-center gap-2">
                        {flow.steps.map((step, i) => (
                          <div key={step} className="flex items-center gap-2">
                            {i > 0 && (
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <Badge
                              variant={
                                step === "Confirmed" ? "default" : "outline"
                              }
                              className={
                                step === "Confirmed"
                                  ? "bg-success hover:bg-success"
                                  : ""
                              }
                            >
                              {step}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {flow.description}
                      </p>

                      <div className="rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {flow.highlight}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* AVAILABILITY STUDIO                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Availability Studio
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Your schedule. One visual timeline.
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              See your entire day at a glance. Manage everything by placing
              blocks. All blocks prevent double-booking automatically.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <Card className="border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {/* Block legend */}
                <div className="flex flex-wrap gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
                  {STUDIO_BLOCKS.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${block.dotColor}`}
                      />
                      <span className="text-muted-foreground">
                        {block.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="divide-y divide-border/40">
                  {TIMELINE_SLOTS.map((slot) => (
                    <div key={slot.hour} className="flex items-stretch">
                      <div className="flex w-16 shrink-0 items-center justify-center border-r border-border/40 bg-muted/20 px-2 py-3 text-xs text-muted-foreground">
                        {slot.hour}
                      </div>
                      <div className="flex flex-1 items-center gap-2 px-3 py-2.5">
                        <div
                          className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${slotStyles[slot.type]}`}
                        >
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${slotBadgeStyles[slot.type]}`}
                          >
                            {slotBadgeLabels[slot.type]}
                          </span>
                          <span className="truncate">{slot.label}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Block descriptions */}
                <div className="grid gap-3 border-t border-border/60 bg-muted/10 p-4 sm:grid-cols-2">
                  {STUDIO_BLOCKS.map((block) => (
                    <div key={block.id} className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${block.dotColor}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">
                          {block.label}:
                        </strong>{" "}
                        {block.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* GUEST PROFILES                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Guest Profiles
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              For your regulars and walk-ins.
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Not every customer uses the app — and that's fine. Save a guest
              profile once, reuse it every time they book.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {GUEST_SCENARIOS.map((scenario) => (
                <AccordionItem
                  key={scenario.id}
                  value={scenario.id}
                  className="rounded-xl border border-border/60 bg-card px-5 data-[state=open]:bg-card"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-xl" role="img" aria-hidden>
                        {scenario.emoji}
                      </span>
                      <div className="text-left">
                        <p className="font-heading text-sm font-semibold">
                          {scenario.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2 pl-9">
                      {scenario.steps.map((step, i) => (
                        <div key={step} className="flex items-start gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {i + 1}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">
                  One schedule, all customers.
                </strong>{" "}
                Whether bookings come through the app, by phone, or at the front
                desk — everything lives in one place. No double-bookings.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* TEAM ACCESS                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Team Access
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Your team, your rules.
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Invite staff by email. Assign roles so everyone has the right
              level of access — no more, no less.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                emoji: "👑",
                role: "Owner",
                description:
                  "Full control over organization, venues, team, and all reservations.",
              },
              {
                emoji: "🔧",
                role: "Manager",
                description:
                  "All permissions by default — reservations, guest bookings, chat, notifications, and team management.",
              },
              {
                emoji: "👁️",
                role: "Viewer",
                description:
                  "Read-only reservation access. For staff who need visibility without taking action.",
              },
            ].map((card) => (
              <Card
                key={card.role}
                className="border-border/60 bg-card hover:border-border hover:shadow-md transition-all"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-hidden>
                      {card.emoji}
                    </span>
                    <CardTitle className="font-heading text-base">
                      {card.role}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Invite by email. Permissions per person. Team members get their
              own notification preferences and can opt in to reservation alerts
              for each venue.
            </p>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* WORKS ON YOUR PHONE                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-bold tracking-tight">
                    Works on your phone
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Available now
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Install KudosCourts on your home screen — no app store needed.
                  Accept bookings, confirm payments, and manage your schedule
                  from any device. Push notifications keep you in the loop.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  {[
                    "Install to home screen",
                    "Accept/reject bookings",
                    "Push notifications",
                    "Full schedule view",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <CheckCircle className="h-3 w-3 text-primary" />
                      {feat}
                    </div>
                  ))}
                </div>
                <p className="pt-2 text-xs text-muted-foreground italic">
                  Native mobile app coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* ANALYTICS                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Analytics
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Know how your venue performs.
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Three dashboards built in — revenue, utilization, and operations.
              No spreadsheets needed.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {/* Revenue */}
            <Card className="border-border/60 bg-card hover:border-border hover:shadow-md transition-all">
              <CardHeader className="space-y-1.5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-heading text-base">
                    Revenue
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Total earnings, average booking value, and daily trends with
                  period-over-period comparison.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end gap-1 h-16" aria-hidden>
                  {[35, 50, 40, 65, 55, 80, 70, 90, 60, 75, 85, 95].map((h) => (
                    <div
                      key={h}
                      className="flex-1 rounded-sm bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Per venue & day-of-week</span>
                  <span className="font-medium text-primary">+12%</span>
                </div>
              </CardContent>
            </Card>

            {/* Utilization */}
            <Card className="border-border/60 bg-card hover:border-border hover:shadow-md transition-all">
              <CardHeader className="space-y-1.5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-heading text-base">
                    Utilization
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Venue occupancy rates, peak vs. off-peak usage, and a day×hour
                  heatmap.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-7 gap-0.5 h-16" aria-hidden>
                  {HEATMAP_CELLS.map((cell) => (
                    <div
                      key={cell.key}
                      className="rounded-[2px]"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${cell.v / 100})`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Heatmap by day & hour</span>
                  <span className="font-medium text-primary">72% peak</span>
                </div>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card className="border-border/60 bg-card hover:border-border hover:shadow-md transition-all">
              <CardHeader className="space-y-1.5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-heading text-base">
                    Operations
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Response times, cancellation rates, lead time distribution,
                  and booking volume by hour.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end gap-1 h-16" aria-hidden>
                  {[90, 70, 45, 25, 15, 8].map((h) => (
                    <div
                      key={h}
                      className="flex-1 rounded-sm bg-primary/15"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Response time distribution</span>
                  <span className="font-medium text-primary">~12 min</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              All dashboards are{" "}
              <strong className="text-foreground">included free</strong> —
              filter by date range, compare periods, and drill down by venue.
            </p>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* HOW IT WORKS                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section id="how-it-works" className="py-10 sm:py-14">
        <Container size="xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Live in 4 steps
              </h2>
              <p className="mt-2 text-muted-foreground">
                From zero to bookable in minutes — not weeks.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              ~5 min setup
            </Badge>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.id}
                  className="border-border/60 bg-card hover:border-border hover:shadow-md transition-colors"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                        {step.step}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <CardTitle className="font-heading text-base">
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
              Ready to start? Create your free account in minutes.
            </p>
            <Button asChild className="rounded-xl">
              <Link href={registerHref} onClick={() => handleCtaClick("steps")}>
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* EARLY ADOPTER PERKS                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60 bg-primary/5">
            <CardHeader className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Early Adopter Program
                  </p>
                  <CardTitle className="font-heading text-xl sm:text-2xl">
                    Be first in your city.
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit shrink-0 border-primary/30 text-xs"
                >
                  Limited to 5 partners per city
                </Badge>
              </div>
              <CardDescription>
                Join now and get perks that won't be available later. First
                come, first served.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {PERKS.map((perk) => (
                  <div
                    key={perk.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <span className="text-xl" role="img" aria-hidden>
                      {perk.emoji}
                    </span>
                    <div className="space-y-1">
                      <p className="font-heading text-sm font-semibold">
                        {perk.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {perk.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button asChild size="lg" className="rounded-xl">
                  <Link
                    href={registerHref}
                    onClick={() => handleCtaClick("perks")}
                  >
                    Claim your spot
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CLAIM EXISTING                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section id="claim" className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-heading">
                Already see your venue listed?
              </CardTitle>
              <CardDescription>
                Claim ownership to manage venues, rates, and enable
                reservations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold">
                  1. Find your venue
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search for your venue in the setup hub.
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
                  Once approved, manage venues and enable bookings.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* VERIFICATION                                                       */}
      {/* ----------------------------------------------------------------- */}
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

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                                */}
      {/* ----------------------------------------------------------------- */}
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
              <p className="text-xs text-muted-foreground">
                Last updated: {OWNER_GET_STARTED_LAST_UPDATED_LABEL}
              </p>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-2">
                <Accordion type="single" collapsible>
                  {OWNER_GET_STARTED_FAQS.map((faq) => (
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

      {/* ----------------------------------------------------------------- */}
      {/* ORGANIZATION GUIDE TEASER                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Want to see the full setup walkthrough?
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Our organization guide covers every step from the setup wizard
                through courts, verification, notifications, team access, and
                handling your first reservations.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl">
                  <Link
                    href={appRoutes.guides.detail(
                      "how-to-set-up-your-sports-venue-organization-on-kudoscourts",
                    )}
                  >
                    Read the guide
                    <BookOpen className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  <Link
                    href={registerHref}
                    onClick={() => handleCtaClick("guide-teaser")}
                  >
                    Create free owner account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FINAL CTA                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Your venues deserve better. Your players deserve better.
              </h2>
              <p className="max-w-md text-muted-foreground">
                Claim your venue and start accepting online booking requests
                when you are ready to go live.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl">
                  <Link
                    href={registerHref}
                    onClick={() => handleCtaClick("footer")}
                  >
                    Create free owner account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  <a href="#claim">
                    <Search className="h-4 w-4" />
                    Claim existing listing
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}
