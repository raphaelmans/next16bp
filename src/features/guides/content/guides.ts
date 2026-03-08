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
  audience: "players" | "owners";
  heroEyebrow: string;
  queryCluster: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedLinks: GuideLink[];
};

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
