"use client";

import {
  ArrowRight,
  Building2,
  Calendar,
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
    label: "Free Court",
    steps: ["Pending", "You Accept", "Confirmed"],
    description:
      "A player finds your court and requests a booking. You tap Accept — done. Confirmed instantly. No payment step because the court is free.",
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
    color: "bg-emerald-50 text-emerald-700 border-dashed border-emerald-200",
    dotColor: "bg-emerald-500",
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
    color: "bg-orange-50 text-orange-600 border-dashed border-orange-200",
    dotColor: "bg-orange-400",
    description:
      "Reserve time for walk-in customers. When someone shows up and pays, convert the block into a confirmed guest booking with one tap.",
  },
  {
    id: "guest",
    label: "Guest Booking",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    dotColor: "bg-orange-500",
    description:
      "A confirmed reservation you created directly for a customer. Perfect for regulars, phone bookings, or anyone who pays through traditional channels.",
  },
  {
    id: "booked",
    label: "Booked",
    color: "bg-orange-200/60 text-orange-800 border-orange-300",
    dotColor: "bg-orange-600",
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
      "Someone shows up at your court. You already have a walk-in block set.",
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
    color: "accent" as const,
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
    title: "Court Management",
    description:
      "Day-specific hours, hourly pricing rules, and amenities per court.",
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
    description: "Build trust with players and unlock online reservations.",
    icon: ShieldCheck,
    color: "accent" as const,
  },
  {
    id: "claiming",
    title: "Venue Claiming",
    description: "Already listed on KudosCourts? Claim it and start managing.",
    icon: MapPin,
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
    description:
      "Message players inside the booking context. Limited in free tier — unlimited with Business Plus.",
    icon: MessageSquare,
    badge: "Beta · Limited",
  },
  {
    id: "notifications",
    title: "Push Notifications",
    description:
      "Instant alerts for bookings, payments, and actions. Improving with mobile launch.",
    icon: Calendar,
    badge: "Beta",
  },
  {
    id: "mobile",
    title: "Mobile App",
    description:
      "Accept bookings, confirm payments, and check your schedule from your phone.",
    icon: Smartphone,
    badge: "Beta · Next Week",
  },
];

const BUSINESS_PLUS_FEATURES = [
  "Analytics dashboards — occupancy, revenue, booking patterns",
  "Unlimited in-app chat — no message limits, enhanced coordination",
  'SEO & AI search visibility — rank for "courts in [your city]" searches',
  "Integrations — connect with your existing tools and channels",
  "Multi-user staff access — let your team manage bookings",
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
    id: "business-plus",
    emoji: "⭐",
    title: "6 months of Business Plus — free",
    description:
      "Automatically included when the premium tier launches. Analytics, unlimited chat, integrations, and staff access.",
  },
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

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  accent: { bg: "bg-accent/10", text: "text-accent" },
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
  available: "bg-emerald-50 border-dashed border-emerald-200 text-emerald-700",
  booked: "bg-orange-200/60 border-orange-300 text-orange-800",
  maintenance: "bg-muted/60 border-border text-muted-foreground",
  walkin: "bg-orange-50 border-dashed border-orange-200 text-orange-600",
  guest: "bg-orange-100 border-orange-300 text-orange-700",
};

const slotBadgeStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  booked: "bg-orange-200 text-orange-800",
  maintenance: "bg-muted text-muted-foreground",
  walkin: "bg-orange-100 text-orange-700",
  guest: "bg-orange-200/80 text-orange-800",
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
        <div className="absolute top-40 -left-24 h-[340px] w-[340px] rounded-full bg-accent/10 blur-3xl" />
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
              Your court is already being searched for.
            </h1>

            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Players are already searching for available courts in your city.
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
            Your courts deserve better. Your players deserve better.
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
              The essentials to run your courts — free
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Accept bookings, manage your schedule, and coordinate with
              players. No subscription required for the essentials.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                  ? "bg-emerald-600 hover:bg-emerald-600"
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
      {/* MOBILE APP BANNER                                                  */}
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
                    Mobile app
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Beta launching next week
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage your courts on the go — accept bookings, confirm
                  payments, and check your schedule from your phone. Better
                  notifications mean you never miss a booking.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  {[
                    "Accept/reject bookings",
                    "Confirm payments",
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
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* BUSINESS PLUS                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
              <div className="flex-1 space-y-3">
                <Badge
                  variant="outline"
                  className="border-accent/30 text-accent"
                >
                  Coming Soon
                </Badge>
                <h3 className="font-heading text-xl font-bold tracking-tight">
                  Business Plus
                </h3>
                <p className="text-sm text-muted-foreground">
                  For venues that want more operational depth. Everything in the
                  essentials stay free — Business Plus adds premium tools.
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {BUSINESS_PLUS_FEATURES.map((feat) => (
                  <div key={feat} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                    <p className="text-sm text-muted-foreground">{feat}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                Claim ownership to manage courts, rates, and enable
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
                  Once approved, manage courts and enable bookings.
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
      {/* FINAL CTA                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-10 sm:py-14">
        <Container size="xl">
          <Card className="border-border/60 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Your courts deserve better. Your players deserve better.
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
