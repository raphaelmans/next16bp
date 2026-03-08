import {
  Bell,
  Building2,
  CalendarCheck,
  LayoutGrid,
  ShieldCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import type {
  InteractiveGuideAccordionItem,
  InteractiveGuideCallout,
  InteractiveGuideSection,
  InteractiveGuideSubsection,
  InteractiveGuideTip,
} from "@/features/guides/components/interactive-guide-types";

export type OrgGuideTip = InteractiveGuideTip;
export type OrgGuideCallout = InteractiveGuideCallout;
export type OrgGuideAccordionItem = InteractiveGuideAccordionItem;
export type OrgGuideSubsection = InteractiveGuideSubsection;
export type OrgGuideSection = InteractiveGuideSection;

export const ORG_GUIDE_SECTIONS: OrgGuideSection[] = [
  {
    id: "create-org",
    stepNumber: 1,
    icon: Building2,
    title: "Create the organization and add your first venue",
    paragraphs: [
      "After signing in as an owner, the setup wizard walks you through creating your organization. Start by choosing an organization name — this is the brand players see on your listings.",
      "Next you add your first venue: the physical place where courts live. Fill in the address, select the sports you offer, and list key amenities like parking, restrooms, or lighting.",
      "Think of the organization as the owner-level container that can hold one or more venues. Getting these details right from the start means your listing looks complete to players on day one.",
    ],
    callout: {
      text: "You can always return to the setup wizard later to edit organization details or add more venues.",
    },
    accordionItems: [
      {
        trigger: "Can I change my organization name later?",
        content:
          "Yes. Organization name, logo, and contact details can be updated anytime from the organization settings page.",
      },
      {
        trigger: "What sports can I add?",
        content:
          "KudosCourts supports basketball, badminton, pickleball, tennis, volleyball, table tennis, and more. You pick the sports your venue actually offers.",
      },
    ],
  },
  {
    id: "courts-availability",
    stepNumber: 2,
    icon: LayoutGrid,
    title: "Configure courts and availability",
    paragraphs: [
      "Each venue can have one or more courts. Courts are what players actually book — and they come with their own schedule, pricing, and optional add-ons. This step covers everything you need to go from an empty venue to fully bookable courts.",
      "If you are not ready to publish availability yet, that is fine. Your venue page is discoverable as soon as the listing is complete — availability adds the reservation flow on top.",
    ],
    subsections: [
      {
        id: "courts-create",
        title: "Create your courts",
        paragraphs: [
          "Start by adding courts to your venue. For each court, specify the sport, a label (e.g., Court A, Court B), and an optional tier label to differentiate premium from standard courts.",
          "Courts are the bookable units — everything else (schedule, pricing, add-ons) is configured per court.",
        ],
        tip: {
          text: "If you have similar courts, use the tier label (e.g., Premium, Standard) so players can see what they are booking.",
        },
      },
      {
        id: "courts-schedule",
        title: "Set schedule and pricing",
        paragraphs: [
          "The schedule editor lets you define opening hours and hourly rates for each day of the week in one place. Expand a day, add one or more time blocks, toggle each block open or closed, and set the PHP rate — all from a single screen.",
          "You can add multiple blocks per day for split schedules (e.g., morning and evening sessions). Each block shows its time range, an open/closed toggle, and an optional hourly rate. The editor validates as you go — overlapping blocks and invalid time ranges are flagged before you save.",
          "If you have multiple courts with the same schedule, use the Copy schedule from another court button to replicate hours and pricing in one step.",
        ],
        tip: {
          text: "Set up your weekday schedule first, then use Copy to all to replicate a block across every day. Adjust weekend hours individually.",
        },
        accordionItems: [
          {
            trigger: "Can I set different prices for peak vs off-peak?",
            content:
              "Yes. Add multiple blocks for the same day with different time ranges and rates. For example, Monday 8 AM–5 PM at PHP 300/hr and Monday 5 PM–10 PM at PHP 450/hr.",
          },
          {
            trigger: "What happens if blocks overlap?",
            content:
              "The editor highlights overlapping blocks and shows an error badge on the day. You must resolve them before saving.",
          },
          {
            trigger: "Can I copy a schedule from another court?",
            content:
              "Yes. The Copy schedule button lets you pick a source court and replaces the current schedule with its hours and pricing.",
          },
        ],
      },
      {
        id: "courts-addons",
        title: "Add extras and add-ons",
        paragraphs: [
          "Add-ons are extras players can include with their booking — like equipment rental, court lighting, or towel service. Each add-on has a label, can be optional or auto-applied, and supports either hourly or flat pricing.",
          "For hourly add-ons, you define schedule rules with day pills (pick which days apply) and time windows with a rate. Flat add-ons just have a single fee regardless of time.",
          "Add-ons can be scoped to a single court or made venue-wide so they apply to all courts at the venue.",
        ],
        tip: {
          text: "Start with one or two simple add-ons (like equipment rental) and expand later as you see what players request.",
        },
        accordionItems: [
          {
            trigger: "What is the difference between court and venue-wide?",
            content:
              "A court add-on only appears for that specific court. A venue-wide add-on appears for every court at the venue. You can change the scope at any time.",
          },
          {
            trigger: "What does auto-applied mean?",
            content:
              "An auto-applied add-on is automatically included in every booking for that court. Optional add-ons let the player choose whether to include them.",
          },
        ],
      },
    ],
  },
  {
    id: "payment-methods",
    stepNumber: 3,
    icon: Wallet,
    title: "Add payment methods",
    isOptional: true,
    paragraphs: [
      "If you accept online payments, add your mobile wallets and bank accounts so players know where to send money. KudosCourts supports GCash, Maya, BPI, BDO, and more. Players see the active methods when they confirm a booking through the app.",
      "This step is optional. Many venues handle payment in person — cash at the counter, walk-ins, or phone bookings through guest profiles. If that is your workflow, you can skip payment methods entirely and add them later when you are ready.",
      "Each payment method has a type, provider, account name, and account number. You can also add optional instructions shown to players (e.g., include reservation ID in the payment note). Toggle methods active or inactive without deleting them, and mark one as the default.",
      "Payment methods are configured at the organization level, so they apply across all venues and courts. You can edit, deactivate, or remove them at any time from the organization settings.",
    ],
    tip: {
      text: "GCash and Maya are the most common payment methods players expect in the Philippines. Start with one and add more as needed.",
    },
    callout: {
      text: "Skipping this step does not block your listing. You can always add payment methods later from the organization settings page.",
    },
    accordionItems: [
      {
        trigger: "Can I have multiple payment methods active at once?",
        content:
          "Yes. All active payment methods are shown to the player. The default method appears first in the list.",
      },
      {
        trigger: "What happens if I deactivate a payment method?",
        content:
          "Deactivated methods are hidden from players but not deleted. You can reactivate them at any time.",
      },
      {
        trigger: "Can I add custom payment instructions?",
        content:
          "Yes. Each payment method has an optional instructions field. Use it to tell players to include their booking ID or any other reference in the payment note.",
      },
    ],
  },
  {
    id: "verify-venue",
    stepNumber: 4,
    icon: ShieldCheck,
    title: "Verify your venue and build trust",
    paragraphs: [
      "Verification signals tell players that the listing is managed by a real operator. Complete your venue profile, upload clear photos, confirm your address, and add contact details to build a trustworthy presence.",
      "A verified venue stands out on discovery pages and gives players more confidence when they compare options in the same city. Think of verification as an investment in first impressions.",
      "The verification checklist in your dashboard shows exactly what is complete and what still needs attention. Work through each item and your venue profile will look polished and professional.",
    ],
    tip: {
      text: "Accurate location details are crucial — players use map pins to judge distance, so make sure your address resolves correctly.",
    },
    callout: {
      text: "Verification is not a one-time gate. You can keep improving your listing over time and the trust indicators update automatically.",
    },
  },
  {
    id: "notifications",
    stepNumber: 5,
    icon: Bell,
    title: "Turn on notifications so you never miss a request",
    paragraphs: [
      "The notification bell in the top navigation bar is your real-time inbox. It shows unread reservation requests, booking confirmations, cancellations, and player messages — with a badge count so you can see at a glance if anything needs attention. Open the popover, read a notification, or tap Mark all as read to clear the list.",
      "Enable browser push notifications from the bell popover so you get alerts even when the tab is in the background. Each team member can toggle their own browser notifications independently.",
      "Who receives notifications is controlled by permissions. Team members with the reservation notification permission get alerts automatically — assign it when you invite them or update it later from their role settings.",
    ],
    tip: {
      text: "Enable push notifications on your phone by installing KudosCourts to your home screen — no app store download required.",
    },
    accordionItems: [
      {
        trigger: "What notifications will I receive?",
        content:
          "You receive reservation lifecycle notifications — new requests, confirmations, cancellations, and related updates. These are the essential events for managing your venue.",
      },
      {
        trigger: "Can different team members receive notifications?",
        content:
          "Yes. Team members with the reservation notification permission will receive alerts. The owner controls who has this permission through role and permission settings.",
      },
    ],
  },
  {
    id: "invite-team",
    stepNumber: 6,
    icon: UserPlus,
    title: "Invite your team",
    paragraphs: [
      "If you have staff who help run the venue, invite them as team members by email. Team access lets multiple people manage reservations, respond to messages, and update availability without sharing a single account.",
      "KudosCourts has three roles: Owner (full control), Manager (day-to-day operations), and Viewer (read-only access). Assign the role that matches each person's responsibilities.",
      "You stay in control of permissions at all times. Roles can be changed or revoked, and every action is logged so you know who did what.",
    ],
    tip: {
      text: "Start with Manager access for trusted staff — they can handle reservations and chat without needing full organization settings access.",
    },
    callout: {
      text: "Team members get their own login credentials and notification preferences. No shared passwords needed.",
    },
  },
  {
    id: "reservations",
    stepNumber: 7,
    icon: CalendarCheck,
    title: "Handle reservations and go live",
    paragraphs: [
      "When a player sends a reservation request, you receive a notification with the booking details: court, date, time slot, and any player notes. Review the request and confirm or decline from your dashboard.",
      "The player gets notified of your decision instantly. Confirmed bookings appear on your schedule, and the time slot is automatically marked as taken so no double-bookings happen.",
      "Not every customer uses the app — and that is fine. Guest profiles let you save a name, phone number, and email for your regulars and walk-ins. Create a guest booking from the Availability Studio: pick the time slot, select (or create) a guest profile, and the booking is confirmed instantly. No app needed on their end.",
      "Once you are comfortable with the workflow, your venue is effectively live. Players discover it on city and sport pages, request slots, and you manage everything from the venue dashboard.",
    ],
    tip: {
      text: "Respond to reservation requests within a few hours. Quick turnaround builds trust and encourages repeat bookings from players.",
    },
    callout: {
      text: "Guest profiles keep your schedule accurate for all customers, not just those who book through the app. Save a profile once and reuse it every time they book.",
    },
    accordionItems: [
      {
        trigger: "What happens if I decline a request?",
        content:
          "The player is notified that the request was declined. The time slot remains available for other players. You can optionally include a short message with the reason.",
      },
      {
        trigger: "How do guest bookings work for walk-ins?",
        content:
          "Open the Availability Studio, pick an open slot or convert a walk-in block, select an existing guest profile or create a new one, and the booking is confirmed in one step. The customer never needs to download the app.",
      },
      {
        trigger: "Can I create bookings on behalf of phone callers?",
        content:
          "Yes. Guest bookings cover phone reservations, walk-ins, and repeat customers. Pick the time, choose the guest profile, and the booking is immediately confirmed.",
      },
      {
        trigger: "How do cancellations work?",
        content:
          "Both you and the player can cancel a confirmed booking. The time slot is released back to available, and both parties receive a notification.",
      },
    ],
  },
];
