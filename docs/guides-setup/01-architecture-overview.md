# Architecture Overview

## Goal

The guides system supports two content modes:

- Standard editorial guides rendered from structured text content.
- Rich interactive guides that mix written instructions with inline UI previews.

The important design choice is that the App Router layer stays thin. Route files decide which guide to render and define metadata, but the feature owns the rendering system.

## High-level flow

1. `src/app/(public)/guides/page.tsx` renders the guides index page and exports page metadata.
2. `src/app/(public)/guides/[slug]/page.tsx` resolves the slug, generates static params, generates metadata, injects structured data, and chooses the correct article renderer.
3. `src/features/guides/content/guides.ts` is the canonical registry for guide entries, shared slugs, and guide lookup.
4. `src/features/guides/pages/guide-article-page.tsx` renders the generic article layout for plain text guides.
5. Special interactive guides use dedicated article entry components:
   - `OrgGuideArticlePage`
   - `PlayerBookingGuideArticlePage`
6. Those article entry components pass section definitions and snippet resolvers into `InteractiveGuideArticlePage`.
7. `InteractiveGuideArticlePage` renders the table of contents, sections, subsections, tips, callouts, accordions, and preview snippets.

## Why this architecture works

- Route files stay compliant with the repo boundary rules. New route-local components are not created under `src/app/**`.
- The guide content model is explicit and typed.
- Interactive guides are opt-in. They do not complicate simpler article guides.
- Snippet previews are isolated behind a section-to-component mapping layer.
- SEO concerns are handled once at the route page level instead of being duplicated inside every feature component.

## The core pattern to replicate

Treat the guide system as three separable concerns:

1. Guide discovery and routing.
2. Guide content and section schema.
3. Optional interactive preview rendering.

That separation lets you add plain guides quickly and reserve the richer interactive stack only for guides that justify the extra authoring cost.

## Current special-case behavior

`src/app/(public)/guides/[slug]/page.tsx` uses slug-based branching:

- The organization setup guide slug renders `OrgGuideArticlePage`.
- The player booking guide slug renders `PlayerBookingGuideArticlePage`.
- All other guides fall back to the generic `GuideArticlePage`.

This is simple and effective for a small set of high-value interactive guides. In another repo, keep this approach if only a few guides need custom rendering. Move to an explicit `renderMode` field only if the number of guide variants grows enough that slug checks become noisy.
