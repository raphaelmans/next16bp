"use client";

import { appRoutes } from "@/common/app-routes";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdPlacement = "discovery" | "court-detail" | "search-results";

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
}

// Hardcoded ad content for MVP
const AD_CONTENT: Record<
  AdPlacement,
  { title: string; description: string; cta: string; href: string }
> = {
  discovery: {
    title: "List Your Court on KudosCourts",
    description:
      "Reach thousands of players (pickleball and more). Start accepting bookings today.",
    cta: "Get Started",
    href: appRoutes.ownersGetStarted.base,
  },
  "court-detail": {
    title: "Premium Pickleball + Court Gear",
    description: "Get 20% off your first order with code KUDOS20",
    cta: "Shop Now",
    href: "#",
  },
  "search-results": {
    title: "Become a Verified Court",
    description:
      "Get a verified badge and priority placement in search results.",
    cta: "Learn More",
    href: `${appRoutes.ownersGetStarted.base}#verification`,
  },
};

export function AdBanner({ placement, className }: AdBannerProps) {
  const content = AD_CONTENT[placement];

  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/5 to-primary/5 p-4 sm:p-6",
        className,
      )}
    >
      {/* Sponsored label */}
      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        Sponsored
      </span>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-heading font-semibold text-foreground">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {content.description}
          </p>
        </div>
        <a
          href={content.href}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap"
        >
          {content.cta}
        </a>
      </div>
    </Card>
  );
}
