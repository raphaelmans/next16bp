"use client";

import { KudosCourtsLogo } from "@/components/kudoscourts-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck,
  Facebook,
  Instagram,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function Home() {
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("You're on the list! We'll notify you when we launch.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <KudosCourtsLogo size={32} />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              KudosCourts
            </span>
          </div>
          <div className="flex gap-4">
            <a
              href="https://facebook.com/kudoscourts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <Facebook className="size-5" />
            </a>
            <a
              href="https://instagram.com/kudoscourts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <Instagram className="size-5" />
            </a>
          </div>
        </div>
      </nav>

      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
          <div className="container mx-auto px-6">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
              <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
                <h1 className="animate-fade-in-up stagger-1 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
                  Discover. Reserve. <span className="text-primary">Play.</span>
                </h1>
                <p className="animate-fade-in-up stagger-2 mt-6 text-lg text-muted-foreground">
                  Stop calling around. Find pickleball courts near you, check
                  real-time availability, and book your next game in seconds.
                  The unified platform for players and court owners.
                </p>
                <div className="animate-fade-in-up stagger-3 mt-8 flex flex-wrap gap-x-6 gap-y-4">
                  <form
                    onSubmit={handleJoin}
                    className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
                  >
                    <div className="w-full">
                      <label htmlFor="hero-email" className="sr-only">
                        Email address
                      </label>
                      <Input
                        id="hero-email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-12 w-full bg-card"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 bg-primary px-8 font-heading font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Join Waitlist
                    </Button>
                  </form>
                </div>
                <div className="animate-fade-in-up stagger-4 mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[
                      "photo-1507003211169-0a1dd7228f2d",
                      "photo-1494790108377-be9c29b29330",
                      "photo-1500648767791-00dcc994a43e",
                      "photo-1438761681033-6461ffad8d80",
                    ].map((photoId) => (
                      <div
                        key={photoId}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted overflow-hidden"
                      >
                        <Image
                          src={`https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=64&h=64&q=80`}
                          alt="Player avatar"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p>Join hundreds of players waiting to play.</p>
                </div>
              </div>
              <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
                <div className="animate-fade-in-up stagger-5 relative rounded-[32px] overflow-hidden shadow-2xl bg-muted aspect-[4/3] lg:aspect-auto lg:h-full">
                  <Image
                    src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80"
                    alt="Tennis court with players"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                        <MapPin className="size-4" />
                      </div>
                      <span className="font-semibold text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                        KudosCourts Center
                      </span>
                    </div>
                    <p className="text-sm opacity-90">
                      Find courts like this near you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-muted/50 py-24 sm:py-32">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="font-heading text-base font-semibold leading-7 text-primary">
                Better Booking
              </h2>
              <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to get on the court
              </p>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                We're solving the fragmentation in the pickleball community. No
                more messaging 5 different Facebook pages to find an open slot.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Search className="h-6 w-6" aria-hidden="true" />
                    </div>
                    Unified Discovery
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">
                      Search by location to find curated courts and real-time
                      availability. See photos, amenities, and contact info in
                      one place.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarCheck className="h-6 w-6" aria-hidden="true" />
                    </div>
                    Instant Reservations
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">
                      Book reservable courts directly through the app. See open
                      slots and secure your time instantly without the back and
                      forth.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                    </div>
                    Secure P2P Payments
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">
                      We facilitate secure peer-to-peer payment confirmation.
                      Pay via GCash or bank transfer directly to the owner, and
                      get confirmed.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* For Court Owners */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-5">
            <svg
              className="absolute left-[50%] top-0 h-[48rem] w-[128rem] -translate-x-1/2 stroke-foreground mask-image:radial-gradient(closest-side,white,transparent)"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="owners-pattern"
                  width={200}
                  height={200}
                  x="50%"
                  y={-1}
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M100 200V.5M.5 .5H200" fill="none" />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                strokeWidth={0}
                fill="url(#owners-pattern)"
              />
            </svg>
          </div>
          <div className="container mx-auto px-6 lg:flex lg:items-center lg:gap-x-16">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
              <div className="flex items-center gap-2 text-accent mb-4">
                <Users className="size-5" />
                <span className="font-semibold text-sm uppercase tracking-wider">
                  For Organization Owners
                </span>
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Claim your court listing
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Is your court already listed as a curated location? Claim it to
                unlock full reservation management.
              </p>
              <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base leading-7 text-foreground sm:grid-cols-2">
                {[
                  "Manage availability calendar",
                  "Receive direct bookings",
                  "Verify P2P payments",
                  "Update court photos & info",
                ].map((item) => (
                  <li key={item} className="flex gap-x-3">
                    <Sparkles
                      className="h-6 w-5 flex-none text-accent"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex items-center gap-x-6">
                <Button
                  onClick={() =>
                    toast.info(
                      "Claiming flow coming soon. Join the waitlist for updates.",
                    )
                  }
                  variant="outline"
                  size="lg"
                  className="border-accent text-accent hover:bg-accent hover:text-white"
                >
                  Claim My Court
                </Button>
              </div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
              <div className="relative mx-auto w-[22rem] max-w-full drop-shadow-xl lg:mr-0">
                <div className="relative rounded-2xl bg-card p-6 ring-1 ring-border">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                      K
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Kudos Center
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Managed by You
                      </p>
                    </div>
                    <span className="ml-auto inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Claimed
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-24 rounded-lg bg-muted/50 w-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted/50" />
                      <div className="h-4 w-1/2 rounded bg-muted/50" />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Pending Bookings
                        </span>
                        <span className="font-semibold text-primary">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="bg-primary py-16 sm:py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to hit the court?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
              Join the waitlist today and be the first to know when KudosCourts
              launches in your area.
            </p>
            <div className="mt-10 flex justify-center">
              <form
                onSubmit={handleJoin}
                className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full bg-white/10 text-white placeholder:text-white/60 border-white/20 focus-visible:ring-white"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 bg-white text-primary hover:bg-white/90 font-semibold"
                >
                  Join Now
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background py-12 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <KudosCourtsLogo size={24} />
            <span className="text-sm font-semibold text-muted-foreground">
              © {new Date().getFullYear()} KudosCourts
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">
              Privacy
            </span>
            <span className="hover:text-foreground cursor-pointer">Terms</span>
            <span className="hover:text-foreground cursor-pointer">
              Contact
            </span>
          </div>
          <div className="flex gap-4">
            <a
              href="https://facebook.com/kudoscourts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <Facebook className="size-5" />
            </a>
            <a
              href="https://instagram.com/kudoscourts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <Instagram className="size-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
