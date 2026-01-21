# [00-89] List Your Venue OG Image

> Date: 2026-01-21
> Previous: 00-88-owner-onboarding-intent-fallback.md

## Summary

Added a dedicated Open Graph image for the `/list-your-venue` landing page using the same `opengraph-image.tsx` pattern as court detail pages.

## Changes Made

### Metadata / Social Preview

| File | Change |
| --- | --- |
| `src/app/(public)/list-your-venue/opengraph-image.tsx` | Added ImageResponse-based OG image with branding and partner onboarding copy. |

### Tooling / Validation

| Command | Result |
| --- | --- |
| `pnpm lint` | Passed (Biome check) |
| `pnpm build` | Passed (Next.js build) |

## Key Decisions

- Followed Next.js `opengraph-image.tsx` file convention to ensure crawlers fetch the correct image for `/list-your-venue`.

## Commands to Continue

```bash
pnpm dev
```
