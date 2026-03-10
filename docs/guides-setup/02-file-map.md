# File Map

## Route boundary

These files belong in the App Router layer and should stay thin:

- `src/app/(public)/guides/page.tsx`
  - Exports metadata for the guides hub.
  - Delegates rendering to `GuidesIndexPage`.
- `src/app/(public)/guides/[slug]/page.tsx`
  - Exports `dynamicParams = false`.
  - Exports `generateStaticParams()`.
  - Exports `generateMetadata()`.
  - Resolves the slug and chooses generic or interactive rendering.

## Feature-owned pages

- `src/features/guides/pages/guides-index-page.tsx`
  - Renders the guides hub UI.
  - Splits guides by audience.
  - Promotes specific guide slugs into featured cards.
- `src/features/guides/pages/guide-article-page.tsx`
  - Generic article layout for non-interactive guides.
  - Renders header, sections, FAQs, related links, and JSON-LD.

## Content registry

- `src/features/guides/content/guides.ts`
  - Defines `GuideEntry` and related types.
  - Stores guide slugs.
  - Stores all generic guide metadata and body sections.
  - Exports `getGuideBySlug()`.

## Interactive guide contracts

- `src/features/guides/components/interactive-guide-types.ts`
  - Defines the section, subsection, tip, callout, and accordion types.
- `src/features/guides/components/interactive-guide-article-page.tsx`
  - Reusable client shell for interactive guides.
  - Owns table of contents, active section tracking, and section rendering.

## Interactive guide entry points

- `src/features/guides/components/org-guide-article-page.tsx`
- `src/features/guides/components/player-booking-guide-article-page.tsx`

Each entry point wires together:

- The section content array.
- The section-id-to-snippet resolver.
- Optional header and footer chrome passed from the server page.

## Interactive guide content

- `src/features/guides/components/org-guide-content.ts`
- `src/features/guides/components/player-booking-guide-content.ts`

These files are pure content definitions. They contain section structure, copy, icons, tips, callouts, and FAQ-style accordion content, but not rendering logic.

## Interactive preview layer

- `src/features/guides/components/guide-snippet-wrapper.tsx`
  - Standard wrapper for inline previews.
  - Labels snippets as "What you will see".
  - Disables pointer interaction to keep previews inert.
- `src/features/guides/components/org-guide-snippets.tsx`
- `src/features/guides/components/player-booking-guide-snippets.tsx`
  - Export preview components.
  - Export a mapping function from section id to snippet component.

## Replication recommendation

Mirror the same directory split in the new repo:

```text
src/
  app/
    (public)/
      guides/
        page.tsx
        [slug]/
          page.tsx
  features/
    guides/
      content/
        guides.ts
      pages/
        guides-index-page.tsx
        guide-article-page.tsx
      components/
        interactive-guide-types.ts
        interactive-guide-article-page.tsx
        guide-snippet-wrapper.tsx
        some-guide-article-page.tsx
        some-guide-content.ts
        some-guide-snippets.tsx
```

Do not put this system directly under `src/app/**` beyond the route entry files.
