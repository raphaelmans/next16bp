"use client";

import { AlertCircle, ExternalLink, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AvailabilityDiagnostics {
  hasHoursWindows: boolean;
  hasRateRules: boolean;
  dayHasHours: boolean;
  allSlotsBooked: boolean;
  reservationsDisabled?: boolean;
}

export interface ContactInfo {
  phoneNumber?: string | null;
  viberInfo?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
}

export interface AvailabilityEmptyStateProps {
  diagnostics?: AvailabilityDiagnostics | null;
  variant: "public" | "owner";
  scheduleHref?: string;
  contact?: ContactInfo | null;
  className?: string;
}

function toDialablePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function buildViberDeepLink(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  return `viber://chat?number=${cleaned}`;
}

type EmptyStateReason =
  | "no_schedule"
  | "no_pricing"
  | "closed"
  | "fully_booked"
  | "reservations_disabled"
  | "unknown";

function determineReason(
  diagnostics?: AvailabilityDiagnostics | null,
): EmptyStateReason {
  if (!diagnostics) return "unknown";

  if (diagnostics.reservationsDisabled) return "reservations_disabled";
  if (!diagnostics.hasHoursWindows) return "no_schedule";
  if (!diagnostics.hasRateRules) return "no_pricing";
  if (!diagnostics.dayHasHours) return "closed";
  if (diagnostics.allSlotsBooked) return "fully_booked";

  return "unknown";
}

const publicMessages: Record<
  EmptyStateReason,
  { title: string; body: string }
> = {
  reservations_disabled: {
    title: "No available times for this date",
    body: "This venue isn't accepting online bookings at the moment. Contact the venue directly to inquire about availability.",
  },
  no_schedule: {
    title: "No available times for this date",
    body: "This venue isn't accepting online bookings for this day. Contact the venue directly to inquire about availability.",
  },
  no_pricing: {
    title: "No available times for this date",
    body: "This venue isn't accepting online bookings for this day. Contact the venue directly to inquire about availability.",
  },
  closed: {
    title: "Closed on this day",
    body: "This venue doesn't have operating hours on this day. Try another date.",
  },
  fully_booked: {
    title: "Fully booked for this date",
    body: "All slots have been reserved for this day. Try another date or check back later for cancellations.",
  },
  unknown: {
    title: "No available times for this date",
    body: "No available start times could be found. Try selecting a different date.",
  },
};

const ownerMessages: Record<EmptyStateReason, { title: string; body: string }> =
  {
    reservations_disabled: {
      title: "Reservations are disabled",
      body: "Your venue is verified but reservations are currently turned off. Enable reservations in the venue verification panel to start accepting bookings.",
    },
    no_schedule: {
      title: "No schedule hours configured",
      body: "You haven't set up operating hours for this court yet. Add schedule hours to enable availability.",
    },
    no_pricing: {
      title: "No pricing rules configured",
      body: "You haven't set up pricing for this court yet. Add pricing rules to enable bookings.",
    },
    closed: {
      title: "No operating hours for this day",
      body: "This court doesn't have schedule hours configured for this day of the week.",
    },
    fully_booked: {
      title: "All slots are booked",
      body: "All available time slots for this period have been reserved or blocked.",
    },
    unknown: {
      title: "No available times",
      body: "No available start times could be found. Check your schedule and pricing configuration.",
    },
  };

function ContactActions({ contact }: { contact?: ContactInfo | null }) {
  if (!contact) return null;

  const phoneNumber = contact.phoneNumber?.trim();
  const viberNumber = contact.viberInfo?.trim();
  const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
  const viberLink = viberNumber ? buildViberDeepLink(viberNumber) : "";

  const hasAnyContact =
    phoneNumber || viberNumber || contact.websiteUrl || contact.facebookUrl;

  if (!hasAnyContact) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {phoneNumber && (
        <Button variant="outline" size="sm" asChild>
          <a href={`tel:${dialablePhone || phoneNumber}`}>
            <Phone className="h-4 w-4 mr-1.5" />
            {phoneNumber}
          </a>
        </Button>
      )}
      {viberNumber && (
        <Button variant="outline" size="sm" asChild>
          <a href={viberLink || `viber://chat?number=${viberNumber}`}>
            <Phone className="h-4 w-4 mr-1.5" />
            Viber
          </a>
        </Button>
      )}
      {contact.websiteUrl && (
        <Button variant="outline" size="sm" asChild>
          <a
            href={contact.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      )}
      {contact.facebookUrl && (
        <Button variant="outline" size="sm" asChild>
          <a
            href={contact.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      )}
    </div>
  );
}

export function AvailabilityEmptyState({
  diagnostics,
  variant,
  scheduleHref,
  contact,
  className,
}: AvailabilityEmptyStateProps) {
  const reason = determineReason(diagnostics);
  const messages = variant === "public" ? publicMessages : ownerMessages;
  const { title, body } = messages[reason];

  const showWarningIcon =
    variant === "owner" &&
    (reason === "no_schedule" ||
      reason === "no_pricing" ||
      reason === "reservations_disabled");
  const showContactInfo =
    variant === "public" &&
    (reason === "no_schedule" ||
      reason === "no_pricing" ||
      reason === "unknown");

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-2 py-6 text-center",
        className,
      )}
    >
      {showWarningIcon && (
        <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
      )}
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground max-w-md">{body}</p>

      {variant === "owner" && scheduleHref && (
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href={scheduleHref}>Edit schedule & pricing</Link>
        </Button>
      )}

      {showContactInfo && <ContactActions contact={contact} />}
    </div>
  );
}
