"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const coachNavItems = [
  {
    label: "Dashboard",
    href: appRoutes.coach.dashboard,
    description: "Overview stats and pending bookings.",
    status: "active" as const,
  },
  {
    label: "Get Started",
    href: appRoutes.coach.getStarted,
    description: "Complete your public coach setup.",
    status: "active" as const,
  },
  {
    label: "Profile",
    href: appRoutes.coach.profile,
    description: "Detailed editing arrives in a later step.",
    status: "upcoming" as const,
  },
  {
    label: "Payment Methods",
    href: appRoutes.coach.paymentMethods,
    description: "Manage player payment instructions.",
    status: "active" as const,
  },
  {
    label: "Schedule",
    href: appRoutes.coach.schedule,
    description: "Weekly hours and time blocks.",
    status: "active" as const,
  },
  {
    label: "Pricing",
    href: appRoutes.coach.pricing,
    description: "Rate rules and add-ons.",
    status: "active" as const,
  },
  {
    label: "Reservations",
    href: appRoutes.coach.reservations,
    description: "Player booking inbox and actions.",
    status: "active" as const,
  },
];

export function CoachPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Coach Portal
            </p>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Build your coaching profile
            </h1>
          </div>
          <Badge variant="secondary">Payment live</Badge>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-80">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Coach workspace
              </h2>
              <p className="text-sm text-muted-foreground">
                Payment, schedule, and pricing are live alongside the setup
                wizard. The remaining coach portal surfaces land in later tasks.
              </p>
            </div>

            <nav className="space-y-2" aria-label="Coach portal">
              {coachNavItems.map((item) => {
                const isActive =
                  item.status === "active" &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));

                const itemClassName = cn(
                  "block rounded-xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10"
                    : "border-border hover:border-primary/20 hover:bg-accent/40",
                  item.status === "upcoming" && "opacity-70",
                );

                if (item.status === "upcoming") {
                  return (
                    <div key={item.href} className={itemClassName}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={itemClassName}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                      {isActive ? <Badge>Open</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
