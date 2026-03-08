"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { Container } from "@/components/layout/container";
import type { LandingVariant } from "@/features/home/constants/landing-variant";

const BEFORE_ITEMS = [
  "Scroll through dozens of Facebook pages to find one venue",
  "Check separate reservation sites for each venue",
  "Read scattered reviews across multiple platforms",
  "Call or message venues one by one to ask about availability",
];

const AFTER_ITEMS = [
  "Search venues by city, sport, or amenities in seconds",
  "Read real player reviews right on each venue page",
  "Check amenities, photos, and pricing at a glance",
  "See availability when venues manage it online",
];

interface BeforeAfterProps {
  variant: LandingVariant;
}

const sectionStyles: Record<LandingVariant, string> = {
  "bold-athletic": "py-24 bg-teal-50/50",
  "clean-minimal": "py-20 md:py-32",
  "warm-community": "py-24 bg-teal-50/30",
};

const beforeCardStyles: Record<LandingVariant, string> = {
  "bold-athletic":
    "rounded-lg border border-destructive/10 bg-gradient-to-br from-destructive/[0.035] to-destructive/[0.015] p-9",
  "clean-minimal": "rounded-xl border border-gray-200 bg-gray-50 p-9",
  "warm-community": "rounded-2xl border border-destructive/10 bg-white p-9",
};

const afterCardStyles: Record<LandingVariant, string> = {
  "bold-athletic":
    "rounded-lg border border-primary/12 bg-gradient-to-br from-primary/[0.04] to-primary/[0.015] p-9",
  "clean-minimal": "rounded-xl border border-primary/20 bg-white p-9",
  "warm-community": "rounded-2xl border border-primary/12 bg-teal-50 p-9",
};

export function BeforeAfter({ variant }: BeforeAfterProps) {
  return (
    <section className={sectionStyles[variant]}>
      <Container>
        <div className="text-center mb-14">
          <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
            The difference
          </p>
          <h2 className="font-heading text-[34px] font-extrabold tracking-[-0.03em]">
            How players find venues — before vs. now
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] items-stretch">
          {/* Before */}
          <div className={beforeCardStyles[variant]}>
            <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-6 text-muted-foreground">
              The old way
            </h3>
            <ul className="space-y-4">
              {BEFORE_ITEMS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-[15px] text-muted-foreground"
                >
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center py-3 md:py-0">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_14px_color-mix(in_oklch,var(--color-primary)_25%,transparent)] md:rotate-0 rotate-90">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>

          {/* After */}
          <div className={afterCardStyles[variant]}>
            <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-6 text-primary">
              With KudosCourts
            </h3>
            <ul className="space-y-4">
              {AFTER_ITEMS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-[15px] font-medium"
                >
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
