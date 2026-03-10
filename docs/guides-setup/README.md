# Guides Setup

This folder documents the guide system implemented in this repository so the same pattern can be recreated in another Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui codebase.

The architecture is built around a few clear layers:

1. Thin App Router route files under `src/app/(public)/guides/**`.
2. Feature-owned guide pages, content registries, and interactive article shells under `src/features/guides/**`.
3. A split between plain SEO guides and richer interactive guides.
4. A snippet preview strategy that aims for "what you see is what you get".

Read these files in order:

- `01-architecture-overview.md`
- `02-file-map.md`
- `03-content-model-and-slugs.md`
- `04-interactive-article-shell.md`
- `05-snippet-preview-pattern.md`
- `06-seo-routing-and-metadata.md`
- `07-replication-playbook.md`

Primary source files from this repo:

- `src/app/(public)/guides/page.tsx`
- `src/app/(public)/guides/[slug]/page.tsx`
- `src/features/guides/pages/guides-index-page.tsx`
- `src/features/guides/pages/guide-article-page.tsx`
- `src/features/guides/content/guides.ts`
- `src/features/guides/components/interactive-guide-article-page.tsx`
- `src/features/guides/components/interactive-guide-types.ts`
- `src/features/guides/components/org-guide-article-page.tsx`
- `src/features/guides/components/player-booking-guide-article-page.tsx`
- `src/features/guides/components/org-guide-content.ts`
- `src/features/guides/components/player-booking-guide-content.ts`
- `src/features/guides/components/org-guide-snippets.tsx`
- `src/features/guides/components/player-booking-guide-snippets.tsx`
- `src/features/guides/components/guide-snippet-wrapper.tsx`
