import { appRoutes } from "@/common/app-routes";

export type GuideFaq = {
  question: string;
  answer: string;
};

export type GuideSection = {
  title: string;
  paragraphs: string[];
};

export type GuideLink = {
  label: string;
  href: string;
};

export type GuideEntry = {
  slug: string;
  title: string;
  description: string;
  audience: "players" | "owners" | "developers";
  heroEyebrow: string;
  queryCluster: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedLinks: GuideLink[];
};

export const ORG_GUIDE_SLUG =
  "how-to-set-up-your-sports-venue-organization-on-kudoscourts";
export const PLAYER_BOOKING_GUIDE_SLUG =
  "how-to-book-a-sports-court-on-kudoscourts";
export const DEVELOPER_GUIDE_SLUG =
  "how-to-connect-your-venue-system-to-the-kudoscourts-developer-api";

const GUIDE_PUBLISHED_AT = "2026-03-08";

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    slug: "how-to-find-pickleball-courts-in-cebu-city",
    title: "How To Find Pickleball Courts In Cebu City",
    description:
      "A player-first guide to finding pickleball courts in Cebu City using city pages, venue details, reviews, and availability signals.",
    audience: "players",
    heroEyebrow: "Player Guide",
    queryCluster: "how to find pickleball courts in cebu city",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "The fastest way to find pickleball courts in Cebu City is to start with a city-and-sport page, compare venue details, then open the venue page to check reviews, amenities, and availability signals before you message or reserve.",
    sections: [
      {
        title: "Start with the city and sport, not a general search",
        paragraphs: [
          "When you search broadly, you end up bouncing between scattered Facebook pages, old posts, and incomplete maps listings. A focused city-and-sport page narrows the list to venues that actually matter for your next game.",
          "For Cebu City, the goal is to compare the active pickleball options first, then decide which venue page deserves a closer look.",
        ],
      },
      {
        title: "Check the venue page for trust signals",
        paragraphs: [
          "Once you open a venue page, look for photos, exact location details, sport coverage, and review signals. These details tell you whether a venue is active, maintained, and useful for planning a session with friends.",
          "If a venue publishes availability, that should guide your next step. If it does not, the contact details, amenities, and reviews still help you decide whether it is worth calling ahead.",
        ],
      },
      {
        title: "Use reviews and amenities to narrow your shortlist",
        paragraphs: [
          "Players rarely care about a court name alone. They care whether the venue is easy to reach, what the playing environment feels like, and whether other players would go back.",
          "A better shortlist usually comes from combining review quality, practical amenities, and location fit instead of choosing the first result you see.",
        ],
      },
    ],
    faqs: [
      {
        question:
          "Where should I start if I want to play pickleball in Cebu City?",
        answer:
          "Start on the Cebu City pickleball discovery page so you can compare active venues in one place before opening individual venue pages.",
      },
      {
        question: "What should I check before messaging a venue?",
        answer:
          "Check the venue location, photos, reviews, amenities, and whether the venue publishes availability. That gives you enough context to ask better questions.",
      },
      {
        question: "Does every venue show live availability?",
        answer:
          "No. KudosCourts shows availability when a venue manages it. If a venue does not publish slots, use the venue details page to decide whether it is worth contacting directly.",
      },
    ],
    relatedLinks: [
      {
        label: "Pickleball courts in Cebu City",
        href: appRoutes.courts.locations.sport(
          "cebu",
          "cebu-city",
          "pickleball",
        ),
      },
      {
        label: "Browse all Cebu City venues",
        href: appRoutes.courts.locations.city("cebu", "cebu-city"),
      },
      {
        label: "Browse all venues",
        href: appRoutes.courts.base,
      },
    ],
  },
  {
    slug: "how-to-find-badminton-courts-in-manila",
    title: "How To Find Badminton Courts In Manila",
    description:
      "A practical guide for players who want to find badminton courts in Manila without jumping between listings, social posts, and direct messages.",
    audience: "players",
    heroEyebrow: "Player Guide",
    queryCluster: "how to find badminton courts in manila",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "To find badminton courts in Manila faster, use a location-specific court page first, then compare venue pages for address accuracy, sport coverage, reviews, and amenities before you commit to a schedule.",
    sections: [
      {
        title: "Look for location accuracy first",
        paragraphs: [
          "A common problem with city sports searches is finding a venue name without enough detail to tell whether it is actually convenient for your group.",
          "Start with a Manila-specific page so your first pass is already filtered by place, then confirm the exact venue location on each detail page.",
        ],
      },
      {
        title: "Use venue pages to avoid dead ends",
        paragraphs: [
          "A venue page gives you more than a name. It tells you whether the place is active, what sports it hosts, what photos are available, and whether other players have left reviews.",
          "That saves time because you stop relying on stale social posts or incomplete maps snippets.",
        ],
      },
      {
        title: "Shortlist by fit, not by guesswork",
        paragraphs: [
          "The best venue for your group may not be the first result. It may be the one with the best combination of city fit, amenities, and clearer player feedback.",
          "The point of a discovery platform is not only to find a venue. It is to rule out weak options quickly.",
        ],
      },
    ],
    faqs: [
      {
        question:
          "What is the fastest way to compare badminton venues in Manila?",
        answer:
          "Use the Manila courts discovery surface to narrow the list first, then compare each venue page for location, photos, reviews, and amenities.",
      },
      {
        question:
          "Can I still use KudosCourts if a venue is not taking online reservations?",
        answer:
          "Yes. The venue page still helps you decide where to play by showing the details you need before calling or messaging the venue directly.",
      },
      {
        question: "Why not just search on social media?",
        answer:
          "Social posts are often scattered and incomplete. A focused venue page makes comparison much faster because the address, sports, and venue details are gathered in one place.",
      },
    ],
    relatedLinks: [
      {
        label: "Browse Manila venues",
        href: appRoutes.courts.locations.city("metro-manila", "manila"),
      },
      {
        label: "Browse all venues",
        href: appRoutes.courts.base,
      },
      {
        label: "Guides for players",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: "how-to-find-basketball-courts-in-quezon-city",
    title: "How To Find Basketball Courts In Quezon City",
    description:
      "Use city-based discovery pages and venue detail pages to compare basketball courts in Quezon City without relying on fragmented listings.",
    audience: "players",
    heroEyebrow: "Player Guide",
    queryCluster: "how to find basketball courts in quezon city",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "If you are looking for basketball courts in Quezon City, start with the city page, compare active venues, and use the detail pages to confirm whether each place matches your group, schedule, and location needs.",
    sections: [
      {
        title: "Use the city page as your shortlist builder",
        paragraphs: [
          "A city page helps you avoid broad search noise. Instead of seeing mixed results from different areas, you get a tighter set of venues that are already relevant to Quezon City.",
          "That changes the task from searching everywhere to comparing a usable shortlist.",
        ],
      },
      {
        title: "Open the venue page before you commit",
        paragraphs: [
          "The venue page tells you whether the place looks current, whether it has enough venue detail to be trustworthy, and whether other players have added context through reviews.",
          "That extra context matters more than a one-line listing because it helps you plan with less guesswork.",
        ],
      },
      {
        title: "Plan around real-world convenience",
        paragraphs: [
          "When a venue is in the right city but in the wrong part of the city, the listing is not enough. Venue-level pages make it easier to compare addresses, supporting details, and practical fit.",
          "That is the difference between finding a court and finding the right court for your next run.",
        ],
      },
    ],
    faqs: [
      {
        question: "What should I compare across basketball venue pages?",
        answer:
          "Compare the address, photos, venue details, available sports, reviews, and any availability signals the venue publishes.",
      },
      {
        question:
          "Can a venue page still be useful without online reservations?",
        answer:
          "Yes. Discovery still matters because the venue page helps you decide whether to contact the venue instead of wasting time on incomplete listings.",
      },
      {
        question: "Why use a city page before a venue page?",
        answer:
          "The city page gives you the shortlist. The venue page gives you the depth you need to decide which option fits your group.",
      },
    ],
    relatedLinks: [
      {
        label: "Browse Quezon City venues",
        href: appRoutes.courts.locations.city("metro-manila", "quezon-city"),
      },
      {
        label: "Browse all venues",
        href: appRoutes.courts.base,
      },
      {
        label: "More player guides",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: "how-to-find-tennis-courts-in-davao-city",
    title: "How To Find Tennis Courts In Davao City",
    description:
      "A player-first process for finding tennis courts in Davao City with less tab-hopping and better venue comparison.",
    audience: "players",
    heroEyebrow: "Player Guide",
    queryCluster: "how to find tennis courts in davao city",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "The most reliable way to find tennis courts in Davao City is to search by city first, then review each venue page for the details that matter in real planning: location, photos, reviews, and whether the venue shares availability.",
    sections: [
      {
        title: "Start with a clean city view",
        paragraphs: [
          "General search results often mix venues, social profiles, and unrelated pages. A city-level courts page keeps the search focused on Davao City from the start.",
          "That is especially useful when you want to make a quick decision instead of opening many weak results.",
        ],
      },
      {
        title: "Use venue pages to compare quality",
        paragraphs: [
          "The venue page is where discovery becomes useful. You can compare photos, review signals, and venue details instead of guessing from a name alone.",
          "If a venue manages availability, that gives you a faster path to action. If not, the page still gives you enough context to decide whether to reach out directly.",
        ],
      },
      {
        title: "Keep the shortlist simple",
        paragraphs: [
          "A strong discovery flow is not about opening every option. It is about narrowing the list to the places that look active, match your part of the city, and feel worth the trip.",
          "That is the real value of a structured venue directory for players.",
        ],
      },
    ],
    faqs: [
      {
        question: "What makes a venue page worth trusting?",
        answer:
          "A stronger venue page usually has clear location details, recent photos, sport coverage, review signals, and practical details that help you decide quickly.",
      },
      {
        question: "Should I use reviews even if there are only a few?",
        answer:
          "Yes. Even a small number of real player reviews can add context about the venue experience and help you compare options.",
      },
      {
        question: "What if the venue does not show time slots?",
        answer:
          "Use the venue page to decide whether the court is a good fit, then contact the venue directly. The discovery value is still there even without a reservation flow.",
      },
    ],
    relatedLinks: [
      {
        label: "Browse Davao City venues",
        href: appRoutes.courts.locations.city("davao-del-sur", "davao-city"),
      },
      {
        label: "Browse all venues",
        href: appRoutes.courts.base,
      },
      {
        label: "More player guides",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: PLAYER_BOOKING_GUIDE_SLUG,
    title: "How To Book A Sports Court On KudosCourts",
    description:
      "A player guide to booking a sports court on KudosCourts, from choosing a slot as a guest through reservation tracking and owner confirmation.",
    audience: "players",
    heroEyebrow: "Player Guide",
    queryCluster: "how to book a sports court on kudoscourts",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "To book a sports court on KudosCourts, start on a venue page, pick an available time, sign in or create an account, review the booking, then confirm the request. After submission, you can track it in My Reservations while the owner reviews and confirms the booking.",
    sections: [
      {
        title: "Start on the venue page and choose a time",
        paragraphs: [
          "The booking flow starts on the venue page where you can compare courts, browse available slots, and choose the time that fits your schedule. Guests can explore availability first without signing in, which makes it easier to decide before committing.",
          "Once you select a slot, the primary action shifts from browsing to booking. If you are not signed in yet, KudosCourts keeps the booking context and sends you through the sign-in step so you can continue without starting over.",
        ],
      },
      {
        title: "Sign in or create your account to continue",
        paragraphs: [
          "Guests need an account before a reservation can be submitted. The sign-in or registration step is part of the booking handoff, not a separate process, so the platform returns you to the booking flow after authentication.",
          "That matters because a reservation needs a real player account behind it. The owner needs to know who sent the request, and you need a place to track the booking status afterward.",
        ],
      },
      {
        title: "Review the booking and complete your profile",
        paragraphs: [
          "On the booking review page, check the court, schedule, and pricing details before you confirm. If your player profile is incomplete, KudosCourts prompts you to finish it first so the owner has the details they need to review the request.",
          "You also need to accept the terms and conditions before the confirmation button becomes available. This step is where the booking changes from a selected slot into a formal reservation request.",
        ],
      },
      {
        title: "Submit the reservation request",
        paragraphs: [
          "Clicking Confirm Booking sends the reservation to the venue owner for review. In the standard owner-reviewed flow, this does not mean the booking is instantly confirmed. It means the request has been created successfully and is waiting for the venue's decision.",
          "That pending state is useful because it gives the owner control over acceptance while still giving you a clear record that the reservation was sent. You do not need to guess whether the request went through.",
        ],
      },
      {
        title: "Find the booking in My Reservations",
        paragraphs: [
          "Right after you submit the booking, KudosCourts takes you to the reservation detail page so you can see the current status and next steps. From there, you can always return to My Reservations to find the same booking again later.",
          "While the request is still under review, it appears in the Pending section of My Reservations with its current status. This gives you a single place to check whether the owner is still reviewing, has asked for payment, or has already moved the booking forward.",
        ],
      },
      {
        title: "Watch for owner confirmation",
        paragraphs: [
          "The final step happens after the owner reviews the request. If the venue confirms the reservation, the booking status updates from pending review to confirmed, and the reservation moves into your Upcoming list in My Reservations.",
          "At that point, the booking is no longer just a request. It becomes an active upcoming reservation that you can open again anytime from the reservations page to review the schedule, venue details, and any next actions.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need an account before I can reserve a court?",
        answer:
          "Yes. You can browse venue pages and available slots as a guest, but you need to sign in or create an account before KudosCourts can submit the reservation request.",
      },
      {
        question: "Why is my booking not instantly confirmed?",
        answer:
          "Many venues use an owner-reviewed reservation flow. After you confirm the booking, the request is created first and the venue owner decides whether to approve it.",
      },
      {
        question: "Where do I find my reservation after I submit it?",
        answer:
          "You are taken to the reservation detail page immediately after submission, and you can also find the booking later on the My Reservations page. Pending requests stay under Pending until the owner takes action.",
      },
      {
        question:
          "What should I do if KudosCourts asks me to complete my profile?",
        answer:
          "Finish the required profile details on the booking flow, then return to the review step. The booking cannot be confirmed until the required profile information is complete.",
      },
    ],
    relatedLinks: [
      {
        label: "Browse venue listings",
        href: appRoutes.courts.base,
      },
      {
        label: "My Reservations",
        href: appRoutes.reservations.base,
      },
      {
        label: "More guides",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: DEVELOPER_GUIDE_SLUG,
    title: "How To Connect Your Venue System To The KudosCourts Developer API",
    description:
      "A developer integration guide for venue operators who already run their own system and want to connect it to the KudosCourts developer API safely.",
    audience: "developers",
    heroEyebrow: "Developer Guide",
    queryCluster:
      "how to connect your venue system to the kudoscourts developer api",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "To connect an existing venue system to the KudosCourts developer API, create one integration, issue a scoped key, map external court IDs to live inventory, run the server-side precheck, validate a live availability read in the dashboard, then run one external write and cleanup smoke before handing snippets and the OpenAPI contract to the engineering team.",
    sections: [
      {
        title: "Create one named integration first",
        paragraphs: [
          "Start with a dedicated integration for the external platform or environment you are connecting. That keeps keys, mappings, and readiness checks isolated instead of mixing multiple systems together.",
          "A clear integration boundary also makes the handoff easier because operators and developers can talk about one concrete connection instead of a vague shared setup.",
        ],
      },
      {
        title: "Issue a scoped key and capture the one-time secret",
        paragraphs: [
          "Generate the smallest key you need for the onboarding phase. If the external team only needs reads first, begin with availability.read and add write access later.",
          "Capture the secret immediately in the external team's secret manager because the dashboard only reveals it once.",
          "If you want to validate a real public write before handoff, create a temporary smoke key with both availability.read and availability.write enabled.",
        ],
      },
      {
        title: "Map external court IDs to live inventory",
        paragraphs: [
          "The integration only becomes useful once each external court identifier points to a real court in the organization dashboard. That mapping is what lets live reads and writes resolve safely into the platform's booking model.",
          "Start with one mapped court, confirm the flow works, then expand to the rest of the venue inventory.",
        ],
      },
      {
        title: "Run precheck and a live sample read",
        paragraphs: [
          "The precheck verifies integration status, key health, required scope, mapping existence, and a live availability read through the same server-side flow the product trusts for onboarding.",
          "Once that passes, use the guided console to inspect one real response payload and confirm the request shape before the external team writes code against it.",
          "If you need full contract confidence, follow the green dashboard read with one external unavailability PUT, confirm the blocked slot through the public availability GET, then delete the temporary window immediately.",
        ],
      },
      {
        title: "Hand off snippets, the smoke flow, and the OpenAPI contract",
        paragraphs: [
          "Use the generated snippets as the practical starting point for the first request, then include the OpenAPI document for the complete contract surface.",
          "Pair the snippet with the exact mapped external court id and the write-smoke cleanup sequence you validated. This combination gives external developers both speed and accuracy: quick copy-ready examples plus the full machine-readable API definition.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why create one integration per external platform?",
        answer:
          "It keeps keys, court mappings, and readiness checks isolated so handoff and troubleshooting stay manageable.",
      },
      {
        question: "Does the dashboard execute live write calls?",
        answer:
          "No. In v1 the dashboard only runs a safe live availability read. To validate writes, use the revealed key against the public unavailability route, confirm the result through the public availability read, then clean the temporary window up immediately.",
      },
      {
        question: "Why is the precheck important before handoff?",
        answer:
          "It catches the common launch blockers first: inactive integrations, invalid keys, missing read scope, missing mappings, and failed live sample reads.",
      },
      {
        question: "What should I give the external engineering team?",
        answer:
          "Give them the generated snippet for the first request, the selected external court ID, the one-time secret you stored securely, and the OpenAPI document for the full contract.",
      },
    ],
    relatedLinks: [
      {
        label: "Developer OpenAPI spec",
        href: "/api/developer/v1/openapi.json",
      },
      {
        label: "Owner get started",
        href: appRoutes.ownersGetStarted.base,
      },
      {
        label: "More guides",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: "how-to-set-up-your-sports-venue-organization-on-kudoscourts",
    title: "How To Set Up Your Sports Venue Organization On KudosCourts",
    description:
      "An owner guide to setting up a venue organization on KudosCourts, from the setup wizard through courts, verification, notifications, team access, and reservation handling.",
    audience: "owners",
    heroEyebrow: "Owner Guide",
    queryCluster: "how to set up a sports venue organization on kudoscourts",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "After creating your owner account, the setup wizard walks you through organization basics, venue details, and court configuration. This guide covers each step so you can get from zero to accepting reservation requests with confidence.",
    sections: [
      {
        title: "Create the organization and add your first venue",
        paragraphs: [
          "The setup wizard starts by asking for the organization name, then guides you through adding a venue with its address, sports, photos, and amenities. Think of the organization as the owner-level container and the venue as the physical place players will find.",
          "Getting these details right early means your venue page looks complete to players from day one instead of looking like a placeholder.",
        ],
      },
      {
        title: "Configure courts and availability",
        paragraphs: [
          "Each venue can have one or more courts. Courts define what players actually book, so adding the sport, surface type, and pricing gives players the information they need to decide.",
          "Once courts exist you can open the availability studio to publish time slots. Players can then see when a court is free and send a reservation request without messaging you directly.",
        ],
      },
      {
        title: "Verify your venue and build trust",
        paragraphs: [
          "Verification signals tell players the listing is managed by a real operator. Complete your venue profile, upload clear photos, and confirm location details to earn trust before you go live.",
          "A verified venue stands out in discovery pages and gives players more confidence when they compare options in the same city.",
        ],
      },
      {
        title: "Turn on notifications so you never miss a request",
        paragraphs: [
          "Reservation requests and player messages arrive as notifications. Make sure email and in-app notifications are enabled so you can respond quickly.",
          "Fast response times improve the player experience and increase the chance that a request turns into a confirmed booking.",
        ],
      },
      {
        title: "Invite your team",
        paragraphs: [
          "If you have staff who help run the venue, invite them as team members. Team access lets multiple people manage reservations, respond to messages, and update availability without sharing a single account.",
          "You stay in control of permissions while your team handles day-to-day operations.",
        ],
      },
      {
        title: "Handle reservations and go live",
        paragraphs: [
          "When a player sends a reservation request, you review the details, confirm or decline, and the player gets notified. The reservation flow is designed to give you full control over who books and when.",
          "Once you are comfortable with the workflow, your venue is effectively live. Players discover it, request slots, and you manage everything from the venue dashboard.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long does the setup wizard take?",
        answer:
          "Most owners finish the wizard in under ten minutes. You can always return later to add more details, photos, or courts.",
      },
      {
        question: "Can I manage multiple venues under one organization?",
        answer:
          "Yes. An organization can have multiple venues, each with its own courts, availability, and team members.",
      },
      {
        question:
          "Do I need to publish availability before players can find my venue?",
        answer:
          "No. Your venue page is discoverable as soon as the listing is complete. Publishing availability adds the reservation flow but is not required for discovery.",
      },
      {
        question: "What happens when a player sends a reservation request?",
        answer:
          "You receive a notification, review the request in your dashboard, and confirm or decline. The player is notified of your decision.",
      },
    ],
    relatedLinks: [
      {
        label: "Create your owner account",
        href: appRoutes.ownersGetStarted.base,
      },
      {
        label: "Browse venue listings",
        href: appRoutes.courts.base,
      },
      {
        label: "More guides",
        href: appRoutes.guides.base,
      },
    ],
  },
  {
    slug: "how-to-list-your-sports-venue-online-in-the-philippines",
    title: "How To List Your Sports Venue Online In The Philippines",
    description:
      "An owner guide to getting found by players without giving up control of your listing, pricing, and operations.",
    audience: "owners",
    heroEyebrow: "Owner Guide",
    queryCluster: "how to list your sports venue online in the philippines",
    publishedAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    intro:
      "To list your sports venue online effectively, focus on discoverability first: a clear venue page, accurate location details, strong photos, and enough operational detail for players to trust what they see before they message you.",
    sections: [
      {
        title: "Discovery comes before operations",
        paragraphs: [
          "Most venue owners do not need a complicated transaction stack on day one. They need players to find the venue in the first place.",
          "That means the first job of your online listing is to make the venue searchable by city, sport, and trust signals such as photos and accurate location details.",
        ],
      },
      {
        title: "Give players enough detail to act",
        paragraphs: [
          "A thin listing does not help much. Players want to know where the venue is, what sports it supports, what the place looks like, and whether they can check availability or contact the venue directly.",
          "The more complete the listing, the less time you spend answering the same basic questions one by one.",
        ],
      },
      {
        title: "Keep full control of the venue",
        paragraphs: [
          "A good listing should improve visibility without forcing you to change how you run the venue. That includes keeping control over pricing, operations, and payment methods.",
          "For many owners, the right first step is a stronger discovery presence, then a lighter reservation workflow only when it actually helps the venue.",
        ],
      },
    ],
    faqs: [
      {
        question: "What should a sports venue listing include?",
        answer:
          "Start with the venue name, exact location, sports offered, photos, contact details, and any availability information you are ready to manage.",
      },
      {
        question: "Do I need a full booking system before listing online?",
        answer:
          "No. Discoverability comes first. A strong venue page can already help players find and trust your venue before you add more operational workflows.",
      },
      {
        question: "What is the owner-side value of KudosCourts?",
        answer:
          "KudosCourts helps venues get found by players searching in their city while keeping full control of listings, pricing, and operations.",
      },
    ],
    relatedLinks: [
      {
        label: "List your venue",
        href: appRoutes.ownersGetStarted.base,
      },
      {
        label: "Browse venue listings",
        href: appRoutes.courts.base,
      },
      {
        label: "More guides",
        href: appRoutes.guides.base,
      },
    ],
  },
];

export const GUIDE_MAP = new Map(
  GUIDE_ENTRIES.map((entry) => [entry.slug, entry] as const),
);

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDE_MAP.get(slug);
}
