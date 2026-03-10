# Content Model And Slugs

## Generic guide registry

The generic guide registry lives in `src/features/guides/content/guides.ts`.

Its main responsibilities are:

- Define the core content types.
- Hold canonical guide slugs.
- Store the guide list in one place.
- Provide `getGuideBySlug()` lookup.

The central type is:

```ts
type GuideEntry = {
  slug: string;
  title: string;
  description: string;
  audience: "players" | "owners";
  heroEyebrow: string;
  queryCluster: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  relatedLinks: { label: string; href: string }[];
};
```

That type is intentionally SEO-friendly and editorially simple.

## Shared slug constants

Two high-value interactive guides have dedicated slug constants:

```ts
export const ORG_GUIDE_SLUG =
  "how-to-set-up-your-sports-venue-organization-on-kudoscourts";
export const PLAYER_BOOKING_GUIDE_SLUG =
  "how-to-book-a-sports-court-on-kudoscourts";
```

Use this pattern in the new repo whenever:

- A guide is linked from multiple places.
- A guide is featured on the index page.
- A guide needs custom rendering logic.

Do not scatter magic slug strings across pages and components.

## Two content layers

This repo uses two different authoring models on purpose.

### 1. Generic guides

Generic guides are fully authored inside `GUIDE_ENTRIES`.

Use this model for:

- Standard SEO guides.
- Guides that only need heading + paragraph + FAQ + related links.
- Pages where the body is editorial, not product-demo-driven.

### 2. Interactive guides

Interactive guides split content into:

- Base page metadata in `guides.ts`.
- Rich step-by-step section structure in a dedicated content file such as `org-guide-content.ts`.

Use this model for:

- Onboarding guides.
- Booking or setup walkthroughs.
- Product education pages that need inline UI previews.

## Why the split is useful

The base registry still owns:

- Slug
- title
- description
- intro
- FAQs
- related links
- publish dates

The interactive content file owns:

- Step ids
- step numbers
- section icons
- subsections
- tips
- callouts
- inline accordion explanations

That gives you SEO metadata and index-page compatibility without forcing every guide into the richer step schema.

## Replication rule

In the new repo, keep one canonical `guides.ts` registry even if interactive guides store additional content elsewhere. The route layer should be able to answer these questions from one place:

1. Which guides exist?
2. Which slug maps to which guide?
3. Which metadata should the route export?
4. Which guide URLs should be statically generated?

## Optional enhancement for a larger system

If the new repo expects many interactive guides, add a field like:

```ts
renderMode: "generic" | "interactive-org" | "interactive-player";
```

Then route rendering can switch on `renderMode` instead of comparing slugs.

Do not add that abstraction unless the guide count justifies it. The current slug-based branch is easier to read for a small system.
