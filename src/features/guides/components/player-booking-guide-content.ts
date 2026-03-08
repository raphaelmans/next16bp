import { CalendarCheck, FileText, LogIn, Search } from "lucide-react";
import type { InteractiveGuideSection } from "@/features/guides/components/interactive-guide-types";

export const PLAYER_BOOKING_GUIDE_SECTIONS: InteractiveGuideSection[] = [
  {
    id: "guest-booking",
    stepNumber: 1,
    icon: Search,
    title: "Choose a slot as a guest",
    paragraphs: [
      "The booking flow starts on the venue availability surface, not on a blank checkout page. Players can browse live weekly availability, switch between Pick a court and Any court, and choose a start/end range before signing in.",
      "Once there is an active selection, the summary card reflects the duration, estimated total, add-to-booking state, and the next CTA. KudosCourts preserves that booking context through the authentication handoff so the player does not need to start over.",
    ],
    subsections: [
      {
        id: "guest-slot-picker",
        title: "Pick the court, date, and time",
        paragraphs: [
          "Use the weekly availability grid to choose a start slot and then extend the selection to an end slot. The same booking surface supports Pick a court for a specific court and Any court when the player only cares about finding one available option.",
          "The sidebar summary card changes as the selection changes. With one selection it can send the player straight to review, and with multiple selections it becomes the booking cart entry point for a multi-court request.",
        ],
        tip: {
          text: "Choose the slot first, then sign in. That way the redirect takes you straight back into the booking flow you already started.",
        },
        callout: {
          text: "Cross-week selections are preserved visually. If a chosen range started outside the current visible week but overlaps it, the week grid still renders the visible overlap instead of dropping the selection.",
        },
        accordionItems: [
          {
            trigger: "Can I add multiple courts to one booking?",
            content:
              "Yes. Use Add to booking to build a cart, then continue to checkout. The cart supports one time span per court and keeps all items within the same booking day window.",
          },
          {
            trigger: "What happens if a selection crosses midnight?",
            content:
              "Cross-midnight selections keep their full time span. When the booking summary or cart item crosses into the next day, the UI shows both dates instead of collapsing it into one line.",
          },
        ],
      },
      {
        id: "guest-auth-handoff",
        title: "Use the sign-in handoff",
        paragraphs: [
          "When a guest taps Sign in to reserve, the app redirects to login or registration with a booking return path attached. After authentication, the player lands back on the booking flow instead of the home page.",
          "That handoff matters because the reservation needs a real player identity behind it, and you need an account to track the booking later in My Reservations.",
        ],
        accordionItems: [
          {
            trigger: "Can I create an account from this step?",
            content:
              "Yes. The guest CTA supports both sign-in and registration. Both routes preserve the booking redirect so you can continue afterward.",
          },
        ],
      },
    ],
  },
  {
    id: "review-confirm",
    stepNumber: 2,
    icon: LogIn,
    title: "Review the booking before you confirm",
    paragraphs: [
      "After authentication, the booking review page shows the court, venue, schedule, pricing, and any booking requirements in one place. This is where a selected slot becomes a formal reservation request.",
      "The confirmation button is gated on the last required checks: profile completion and terms acceptance.",
    ],
    subsections: [
      {
        id: "booking-review-summary",
        title: "Check the booking summary",
        paragraphs: [
          "Review the booking summary before submitting. For a single slot, that means the court, date, time, and total. For a multi-court booking, the review page groups every selected item into one request and totals them in the order summary.",
          "If any selected item is no longer available or has incomplete pricing, the review step surfaces that before confirmation. This is the last place to correct the booking before it reaches the owner.",
        ],
        accordionItems: [
          {
            trigger:
              "Does the review page handle multi-court bookings differently?",
            content:
              "Yes. The review page lists every selected court/time span in the Booking Summary card, then repeats those items in the Order Summary with the combined total.",
          },
        ],
      },
      {
        id: "booking-profile-gate",
        title: "Complete your booking profile if prompted",
        paragraphs: [
          "If your player profile is incomplete, KudosCourts opens the booking-profile modal and asks for the missing identity and contact details. The owner needs that information to review and follow up on the reservation.",
          "You only need to complete the required fields once. After saving, the booking flow resumes where you left off.",
        ],
        callout: {
          text: "The profile requirement is part of the booking flow, not a separate account-settings task. Finish it here, then continue immediately.",
        },
      },
      {
        id: "booking-terms-confirm",
        title: "Accept the terms and confirm",
        paragraphs: [
          "The final gate is the terms checkbox. Confirm Booking stays disabled until the player accepts the booking terms and privacy policy.",
          "Once the checkbox is ticked, the primary action becomes available and the reservation can be submitted to the owner.",
        ],
      },
    ],
  },
  {
    id: "reservation-request",
    stepNumber: 3,
    icon: FileText,
    title: "Send the reservation request",
    paragraphs: [
      "Clicking Confirm Booking creates the reservation and immediately redirects the player to the reservation detail page. In the standard owner-reviewed flow, that first screen means the request was sent successfully, not that the booking is already confirmed.",
      "The detail page is the start of the reservation lifecycle. It shows the current state, the timeline of what happened so far, and the Message Owner action so the player can ping the venue while the booking moves from request to confirmation.",
      "If the owner accepts the booking and requires payment, the lifecycle becomes time-sensitive. The player gets a payment window with a visible countdown, and if that TTL expires before payment is completed the reservation moves to Expired and the slot is released.",
    ],
    tip: {
      text: "Treat the first success screen as proof the request was received. The actual confirmation depends on the owner's next action.",
    },
    subsections: [
      {
        id: "reservation-chat-owner",
        title: "Ping the owner in chat while the request is active",
        paragraphs: [
          "The reservation detail flow includes a direct chat surface for owner communication. Players can ping the owner from the status banner or open the reservation chat sheet to ask about confirmation, payment instructions, or booking details.",
          "That chat stays useful across the active lifecycle states. A player can follow up while the request is processing, clarify payment after acceptance, and keep the thread attached to the reservation instead of switching to a separate messaging app.",
        ],
      },
    ],
    accordionItems: [
      {
        trigger: "Why does the status say Processing instead of Confirmed?",
        content:
          "A newly submitted reservation starts in the CREATED state while the owner reviews it. Confirmation happens later when the owner accepts the request.",
      },
      {
        trigger: "What states can the player see after sending the request?",
        content:
          "The lifecycle can move through Processing (CREATED), Awaiting Payment, Payment Pending Confirmation, Confirmed, Cancelled, or Expired depending on what the owner does next.",
      },
      {
        trigger: "Can the player contact the owner from this page?",
        content:
          "Yes. The reservation status banner exposes Message Owner while the reservation is active, so the player can ping the venue without leaving the booking flow.",
      },
      {
        trigger: "How long is the payment window before a reservation expires?",
        content:
          "For this guide, assume a 45-minute payment window. If that window passes without payment, the reservation expires and the slot becomes bookable again.",
      },
    ],
  },
  {
    id: "track-reservation",
    stepNumber: 4,
    icon: CalendarCheck,
    title: "Track the booking in My Reservations",
    paragraphs: [
      "After the redirect to reservation detail, the durable place to follow the booking is My Reservations. That page separates pending requests from confirmed upcoming reservations so the player can tell what still needs owner action.",
      "The same booking can move between those surfaces over time. It starts as pending while the owner reviews it, then becomes an upcoming reservation once the owner confirms it.",
    ],
    subsections: [
      {
        id: "reservation-pending-list",
        title: "Find the request under Pending",
        paragraphs: [
          "While the owner is still reviewing the request, the reservation appears in the Pending section of My Reservations with its processing badge. This is the player-facing view that matches the immediate post-submit state.",
          "If the owner later asks for payment or updates the booking, the reservation stays visible here until it leaves the pending lifecycle.",
        ],
      },
      {
        id: "reservation-confirmed-upcoming",
        title: "Watch it move into Upcoming when confirmed",
        paragraphs: [
          "Once the owner confirms the reservation, the booking status changes to Confirmed and the item moves from Pending into the Upcoming tab. That is how the player knows the request has become a real scheduled booking.",
          "At that point, the reservation is no longer just awaiting owner review. It is an active upcoming booking that can be reopened from the reservations page anytime.",
        ],
        accordionItems: [
          {
            trigger: "Where should I check if I want the final answer quickly?",
            content:
              "Open My Reservations. Pending means the owner still needs to act. Upcoming means the booking is confirmed and scheduled.",
          },
        ],
      },
    ],
  },
];
