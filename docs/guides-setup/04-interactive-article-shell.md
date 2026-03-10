# Interactive Article Shell

## Core contract

The reusable shell is `src/features/guides/components/interactive-guide-article-page.tsx`.

It accepts:

- `sections`
- `getSnippetForSection`
- `header`
- `footer`

This is the center of the rich guide architecture.

## Section schema

The section schema from `interactive-guide-types.ts` supports:

- Required section id, title, step number, and icon.
- Optional `isOptional`.
- Paragraph arrays.
- Optional tips.
- Optional callouts.
- Optional accordion items.
- Optional subsections that can also render snippets, tips, callouts, and accordions.

This is enough structure for step-based product guides without drifting into a full CMS.

## What the shell owns

`InteractiveGuideArticlePage` handles all cross-guide presentation concerns:

- Desktop sticky table of contents.
- Mobile table of contents toggle.
- Active section tracking with `IntersectionObserver`.
- Standard section and subsection rendering.
- Optional snippet rendering by section id.
- Shared styling for tips, callouts, and accordions.

Because that logic is centralized, each guide-specific article page stays very small.

## Guide-specific entry components

The feature creates tiny entry files such as:

- `OrgGuideArticlePage`
- `PlayerBookingGuideArticlePage`

Each file does only this:

1. Import the section array.
2. Import the snippet resolver.
3. Render `InteractiveGuideArticlePage`.

That pattern is worth copying exactly. It keeps the shell generic while preserving explicit files for each guide.

## Header and footer injection

The route page builds the outer article chrome on the server and passes it into the interactive article component as `header` and `footer`.

That means:

- Metadata-driven article chrome stays close to the route.
- The interactive client shell does not need to know how the guide page header is assembled.
- The same shell could be reused in a different page frame later.

## Replication guidance

In the new repo:

- Keep the shell generic.
- Keep guide-specific entry files tiny.
- Keep the route responsible for choosing the guide variant.
- Keep shared article chrome separate from section content.

Do not let snippet logic leak into the route file, and do not let route metadata logic leak into the client shell.

## Minimal implementation sequence

1. Create the types file.
2. Create the generic interactive shell.
3. Create one guide content file with section ids.
4. Create one snippet map keyed by those ids.
5. Create one tiny article entry component that wires them together.
6. Make the route render that article component for the target slug.
