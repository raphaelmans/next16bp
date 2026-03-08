"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HOME_FAQS,
  HOME_LAST_UPDATED_LABEL,
} from "@/features/home/constants/home-faq";
import type { LandingVariant } from "@/features/home/constants/landing-variant";
import { POPULAR_LOCATIONS } from "@/features/home/constants/popular-locations";

interface FaqSectionProps {
  variant: LandingVariant;
}

const sectionStyles: Record<LandingVariant, string> = {
  "bold-athletic": "py-20 bg-teal-50/50 border-t border-border",
  "clean-minimal": "py-20 md:py-32",
  "warm-community": "py-20 bg-teal-50/30",
};

const accordionWrapperStyles: Record<LandingVariant, string> = {
  "bold-athletic": "rounded-lg border border-border bg-white p-2",
  "clean-minimal": "rounded-xl border border-gray-200 bg-white p-2",
  "warm-community": "rounded-2xl border border-border bg-white p-4",
};

export function FaqSection({ variant }: FaqSectionProps) {
  return (
    <section className={sectionStyles[variant]}>
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-extrabold tracking-[-0.03em]">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground max-w-[440px]">
              Direct answers for players exploring courts on KudosCourts.
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

          <div className={accordionWrapperStyles[variant]}>
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
  );
}
