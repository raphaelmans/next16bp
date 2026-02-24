"use client";

import { ArrowRight, Check, Eye, Gift, MapPin, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CountUp from "react-countup";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { URLQueryBuilder } from "@/common/url-query-builder";
import { FeaturedPlaceholderCard, PlaceCard } from "@/components/kudos";
import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DiscoveryPublicShell } from "@/features/discovery/components/public-shell";
import type { PlaceSummary } from "@/features/discovery/helpers";
import { HomeSearchForm } from "@/features/home/components/home-search-form";
import { HomeTrackedLink } from "@/features/home/components/home-tracked-link";
import {
  HOME_FAQS,
  HOME_LAST_UPDATED_LABEL,
} from "@/features/home/constants/home-faq";
import { useQueryHomePlaceStats } from "@/features/home/hooks";

const POPULAR_LOCATIONS = [
  {
    label: "Manila",
    provinceSlug: "metro-manila",
    citySlug: "manila",
  },
  {
    label: "Davao City",
    provinceSlug: "davao-del-sur",
    citySlug: "davao-city",
  },
  {
    label: "Cebu City",
    provinceSlug: "cebu",
    citySlug: "cebu-city",
  },
  {
    label: "Dumaguete",
    provinceSlug: "negros-oriental",
    citySlug: "dumaguete-city",
  },
  {
    label: "Quezon City",
    provinceSlug: "metro-manila",
    citySlug: "quezon-city",
  },
];

const BEFORE_ITEMS = [
  { text: "Message each owner on Facebook separately" },
  { text: "Wait hours or days for a reply" },
  { text: "No way to check real availability" },
  { text: "Hope the slot is still open" },
];

const AFTER_ITEMS = [
  { text: "Search all courts across every venue at once" },
  { text: "See real-time availability instantly" },
  { text: "Book your exact time in one tap" },
  { text: "Get instant confirmation before you go" },
];

const OWNER_BENEFITS = [
  {
    icon: Eye,
    title: "Get Found",
    description:
      "Players are already searching for courts in your city. Make sure they find yours.",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: Zap,
    title: "Easy Setup",
    description:
      "Add your venue and set your hours in minutes. No technical skills needed.",
    iconBg: "bg-accent/10 text-accent",
  },
  {
    icon: Gift,
    title: "Free Reservation System",
    description:
      "No subscription fees. No commissions. Venues keep their existing payment methods.",
    iconBg: "bg-success/10 text-success",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search",
    description:
      "Enter your city or sport. See every venue with open slots right now.",
    numBg: "bg-primary/10 text-primary",
  },
  {
    step: 2,
    title: "Pick a slot",
    description:
      "Browse real-time availability. Tap the time that works for you.",
    numBg: "bg-accent/10 text-accent",
  },
  {
    step: 3,
    title: "Play",
    description: "Get instant confirmation. Show up and play — no surprises.",
    numBg: "bg-success/10 text-success",
  },
];

interface HomePageClientProps {
  featuredPlaces: PlaceSummary[];
}

function ProofBar() {
  const { data: stats } = useQueryHomePlaceStats();

  return (
    <div className="border-y border-border bg-card py-7">
      <Container>
        <div className="flex justify-center gap-14 flex-wrap">
          <div className="text-center">
            <div className="font-heading text-[26px] font-extrabold tracking-tight">
              <span className="text-primary">
                <CountUp
                  end={stats?.totalPlaces ?? 0}
                  duration={1.5}
                  separator=","
                />
              </span>
              +
            </div>
            <div className="text-xs text-muted-foreground font-heading font-medium mt-0.5">
              Venues
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-[26px] font-extrabold tracking-tight">
              <span className="text-primary">
                <CountUp
                  end={stats?.totalCourts ?? 0}
                  duration={1.5}
                  separator=","
                />
              </span>
              +
            </div>
            <div className="text-xs text-muted-foreground font-heading font-medium mt-0.5">
              Courts
            </div>
          </div>
          {(stats?.totalVerifiedVenues ?? 0) >= 10 && (
            <div className="text-center">
              <div className="font-heading text-[26px] font-extrabold tracking-tight">
                <span className="text-primary">
                  <CountUp
                    end={stats?.totalVerifiedVenues ?? 0}
                    duration={1.5}
                    separator=","
                  />
                </span>
                +
              </div>
              <div className="text-xs text-muted-foreground font-heading font-medium mt-0.5">
                Verified Venues
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="font-heading text-[26px] font-extrabold tracking-tight">
              <span className="text-primary">
                <CountUp
                  end={stats?.totalCities ?? 0}
                  duration={1.5}
                  separator=","
                />
              </span>
              +
            </div>
            <div className="text-xs text-muted-foreground font-heading font-medium mt-0.5">
              Cities
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function FinalCtaSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    trackEvent({
      event: "funnel.landing_search_submitted",
      properties: { query: q || undefined },
    });
    if (q) {
      const search = new URLQueryBuilder().addParams({ q }).build();
      router.push(`${appRoutes.courts.base}?${search}`);
    } else {
      router.push(appRoutes.courts.base);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center bg-white rounded-[14px] p-[5px] pl-[18px] shadow-lg min-w-0 sm:min-w-[380px] transition-shadow focus-within:shadow-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courts near you..."
          className="flex-1 border-none outline-none text-[15px] text-foreground bg-transparent placeholder:text-muted-foreground/60 min-w-0"
        />
        <Button
          type="submit"
          className="rounded-[10px] px-[22px] py-[11px] font-heading font-semibold text-sm"
        >
          Search
        </Button>
      </div>
    </form>
  );
}

export default function HomePageClient({
  featuredPlaces,
}: HomePageClientProps) {
  const placeholderCount = Math.max(0, 3 - featuredPlaces.length);

  return (
    <DiscoveryPublicShell>
      {/* § 1. Hero — editorial split */}
      <section className="relative overflow-hidden pt-[140px] pb-20 sm:pt-[140px] sm:pb-20">
        {/* Warm gradient mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "radial-gradient(ellipse 70% 50% at 15% 35%, rgba(13,148,136,0.07) 0%, transparent 55%)",
              "radial-gradient(ellipse 50% 70% at 85% 25%, rgba(249,115,22,0.05) 0%, transparent 45%)",
              "radial-gradient(ellipse 60% 40% at 50% 90%, rgba(13,148,136,0.03) 0%, transparent 50%)",
            ].join(", "),
          }}
        />

        <Container>
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-14 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-primary bg-primary/5 border border-primary/12 px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-[0.05em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live availability across the Philippines · Free for venues
              </div>

              <h1 className="font-heading text-4xl sm:text-[56px] font-black leading-[1.06] tracking-[-0.04em] mb-5">
                Book sports courts
                <span className="block">in the Philippines</span>
                <span className="block">without waiting for replies.</span>
                <span className="block">
                  <span className="relative text-primary inline">
                    Search availability. Reserve your slot.
                    <span className="absolute left-[-2px] right-[-2px] bottom-[2px] h-[13px] bg-primary/10 rounded-[3px] -z-10" />
                  </span>
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground max-w-[430px] mb-8">
                Compare courts by city and sport, check open time slots, and
                confirm your game online. No scattered DMs. No back-and-forth.
              </p>

              <HomeSearchForm
                popularLocations={POPULAR_LOCATIONS}
                variant="hero"
              />

              <p className="mt-5 text-[13px] text-muted-foreground/60">
                Own a court?{" "}
                <Link
                  href={appRoutes.listYourVenue.base}
                  className="text-accent font-semibold font-heading hover:underline"
                >
                  List your venue — free for venues &rarr;
                </Link>
              </p>
            </div>

            {/* Right — showcase cards (hidden on mobile) */}
            <div className="relative h-[480px] hidden lg:block">
              {/* Main card */}
              <div className="absolute w-[310px] top-[10px] left-[10px] z-[3] rotate-[-1.5deg] rounded-[20px] border border-border bg-card shadow-[0_4px_6px_rgba(26,25,23,0.03),0_12px_36px_rgba(26,25,23,0.07)] overflow-hidden transition-transform duration-400 hover:-translate-y-1.5 hover:rotate-0 animate-slide-in-right stagger-2">
                <div className="h-[130px] relative flex items-end p-3 bg-gradient-to-br from-[#0F766E] to-[#14B8A6]">
                  <span className="font-heading text-[10px] font-bold uppercase tracking-[0.06em] text-white bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    Badminton
                  </span>
                </div>
                <div className="p-3.5 pb-4">
                  <h4 className="font-heading text-[15px] font-bold tracking-[-0.01em] mb-0.5">
                    Smash Zone Cebu
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2.5">
                    <MapPin className="h-3 w-3 text-accent" />
                    Cebu City · 4 courts
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-muted text-muted-foreground/60 line-through">
                      2 PM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-success-light text-success">
                      3 PM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-accent/10 text-accent border border-accent/15">
                      4 PM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-muted text-muted-foreground/60 line-through">
                      5 PM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-success-light text-success">
                      6 PM
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 border-t border-border">
                  <span className="font-heading font-bold text-[15px]">
                    ₱200{" "}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      /hr
                    </span>
                  </span>
                  <span className="font-heading text-[11px] font-semibold px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground">
                    Reserve
                  </span>
                </div>
              </div>

              {/* Secondary card */}
              <div className="absolute w-[270px] top-[80px] right-[-10px] z-[2] rotate-[2.5deg] rounded-[20px] border border-border bg-card shadow-[0_4px_6px_rgba(26,25,23,0.03),0_12px_36px_rgba(26,25,23,0.07)] overflow-hidden transition-transform duration-400 hover:-translate-y-1.5 hover:rotate-0 animate-slide-in-right stagger-4">
                <div className="h-[130px] relative flex items-end p-3 bg-gradient-to-br from-accent to-[#FB923C]">
                  <span className="font-heading text-[10px] font-bold uppercase tracking-[0.06em] text-white bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    Pickleball
                  </span>
                </div>
                <div className="p-3.5 pb-4">
                  <h4 className="font-heading text-[15px] font-bold tracking-[-0.01em] mb-0.5">
                    Rally Hub QC
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2.5">
                    <MapPin className="h-3 w-3 text-accent" />
                    Quezon City · 6 courts
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-success-light text-success">
                      9 AM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-success-light text-success">
                      10 AM
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-muted text-muted-foreground/60 line-through">
                      11 AM
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating badge — live */}
              <div className="absolute bottom-[50px] left-[-16px] z-[5] bg-card rounded-[14px] px-4 py-2.5 shadow-[0_6px_20px_rgba(26,25,23,0.09)] border border-border flex items-center gap-2.5 animate-slide-in-right stagger-5">
                <div className="w-9 h-9 rounded-[10px] bg-success-light flex items-center justify-center">
                  <Check className="h-[18px] w-[18px] text-success" />
                </div>
                <div className="font-heading">
                  <strong className="text-sm font-extrabold tracking-[-0.02em] block">
                    Live slots
                  </strong>
                  <small className="text-[11px] text-muted-foreground font-medium">
                    Updated in real-time
                  </small>
                </div>
              </div>

              {/* Floating badge — count */}
              <div className="absolute top-[10px] right-[16px] z-[5] bg-card rounded-[14px] px-4 py-2.5 shadow-[0_6px_20px_rgba(26,25,23,0.09)] border border-border text-center font-heading animate-slide-in-right stagger-5">
                <StatsCountBadge />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* § 2. Social proof bar */}
      <ProofBar />

      {/* § 3. How it works */}
      <section className="py-24 bg-card border-b border-border">
        <Container>
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
              How it works
            </p>
            <h2 className="font-heading text-[34px] font-extrabold tracking-[-0.03em]">
              Book a court in 3 steps
            </h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
            {/* Connecting dashed line (desktop only) */}
            <div className="hidden md:block absolute top-9 left-[17%] right-[17%] h-0.5 bg-[repeating-linear-gradient(90deg,var(--border)_0,var(--border)_8px,transparent_8px,transparent_16px)]" />
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center relative">
                <div
                  className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5 font-heading text-[28px] font-extrabold relative z-10 ${step.numBg}`}
                >
                  {step.step}
                </div>
                <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* § 4. Before / After */}
      <section className="py-24">
        <Container>
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
              The difference
            </p>
            <h2 className="font-heading text-[34px] font-extrabold tracking-[-0.03em]">
              Before vs. after KudosCourts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] items-stretch">
            {/* Before */}
            <div className="rounded-3xl border border-destructive/10 bg-gradient-to-br from-destructive/[0.035] to-destructive/[0.015] p-9">
              <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-6 flex items-center gap-2 text-destructive">
                <span className="text-xl">💩</span> The old way
              </h3>
              <ul className="space-y-4">
                {BEFORE_ITEMS.map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 text-[15px] text-muted-foreground"
                  >
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Arrow divider */}
            <div className="flex items-center justify-center py-3 md:py-0">
              <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_14px_rgba(13,148,136,0.25)] md:rotate-0 rotate-90">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* After */}
            <div className="rounded-3xl border border-primary/12 bg-gradient-to-br from-primary/[0.04] to-primary/[0.015] p-9">
              <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-6 flex items-center gap-2 text-primary">
                <span className="text-xl">⚡</span> With KudosCourts
              </h3>
              <ul className="space-y-4">
                {AFTER_ITEMS.map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 text-[15px] font-medium"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* § 5. Featured Venues */}
      <section className="py-24 bg-card border-t border-border">
        <Container>
          <div className="flex justify-between items-end mb-10">
            <h2 className="font-heading text-[30px] font-extrabold tracking-[-0.03em]">
              Featured Venues
            </h2>
            <HomeTrackedLink
              href={appRoutes.courts.base}
              className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-primary transition-[gap] hover:gap-2.5"
              event="funnel.landing_search_submitted"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </HomeTrackedLink>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
            {placeholderCount >= 1 && <FeaturedPlaceholderCard />}
            {placeholderCount >= 2 && <FeaturedPlaceholderCard />}
            {placeholderCount >= 3 && <FeaturedPlaceholderCard />}
          </div>
        </Container>
      </section>

      {/* § 6. Venue Owners */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <Container>
          <div className="relative">
            <div className="text-center mb-14">
              <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
                For venue owners
              </p>
              <h2 className="font-heading text-[34px] font-extrabold tracking-[-0.03em]">
                Your court is already being searched for.
              </h2>
              <p className="text-base text-muted-foreground max-w-[460px] mx-auto mt-4 leading-relaxed">
                Players already search by city, sport, and availability. List
                your venue so they can find and reserve your slots online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
              {OWNER_BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="p-8 rounded-[20px] bg-card border border-border transition-all hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(26,25,23,0.06)]"
                  >
                    <div
                      className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-[18px] ${benefit.iconBg}`}
                    >
                      <Icon className="h-[26px] w-[26px]" />
                    </div>
                    <h3 className="font-heading text-[17px] font-bold tracking-[-0.01em] mb-1.5">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-11">
              <Button
                asChild
                size="lg"
                className="h-[52px] px-[34px] rounded-[14px] font-heading font-bold text-[15px] shadow-[0_4px_16px_rgba(13,148,136,0.2)] hover:shadow-[0_6px_24px_rgba(13,148,136,0.3)]"
              >
                <Link href={appRoutes.listYourVenue.base}>
                  List Your Venue — Free
                  <ArrowRight className="ml-2 h-[18px] w-[18px]" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* § 7. FAQ + Internal links */}
      <section className="py-20 border-t border-border bg-card">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="font-heading text-3xl font-extrabold tracking-[-0.03em]">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground max-w-[440px]">
                Direct answers for players and venue owners evaluating
                KudosCourts.
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {HOME_LAST_UPDATED_LABEL}
              </p>
              <div className="pt-2 space-y-2">
                <p className="text-sm font-semibold">Popular locations</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((location) => (
                    <Link
                      key={location.label}
                      href={appRoutes.courts.locations.city(
                        location.provinceSlug,
                        location.citySlug,
                      )}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    >
                      {location.label} courts
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-2">
              <Accordion type="single" collapsible>
                {HOME_FAQS.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Container>
      </section>

      {/* § 8. Final CTA — teal band */}
      <section className="relative py-20 bg-primary overflow-hidden">
        {/* Court-line pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "repeating-linear-gradient(0deg, transparent, transparent 58px, rgba(255,255,255,0.04) 58px, rgba(255,255,255,0.04) 60px)",
              "repeating-linear-gradient(90deg, transparent, transparent 58px, rgba(255,255,255,0.04) 58px, rgba(255,255,255,0.04) 60px)",
            ].join(", "),
          }}
        />
        <Container>
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-10">
            <div className="text-center sm:text-left">
              <h2 className="font-heading text-4xl font-extrabold text-primary-foreground tracking-[-0.03em] mb-2">
                Ready to play?
              </h2>
              <p className="text-base text-primary-foreground/70 max-w-[380px]">
                Find available courts and book your next game in seconds.
              </p>
            </div>
            <FinalCtaSearch />
          </div>
        </Container>
      </section>
    </DiscoveryPublicShell>
  );
}

function StatsCountBadge() {
  const { data: stats } = useQueryHomePlaceStats();
  return (
    <>
      <span className="text-xl font-extrabold text-primary tracking-[-0.03em] block">
        <CountUp end={stats?.totalPlaces ?? 0} duration={1.5} separator="," />+
      </span>
      <small className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.04em]">
        Venues
      </small>
    </>
  );
}
