# [00-72] Court Metadata Undefined Fix

> Date: 2026-01-20
> Previous: 00-71-admin-verification-ux-and-reservable.md

## Summary

Fixed incorrect Open Graph/Twitter metadata for public court detail pages where canonical and og:image URLs were rendered as `/courts/undefined`.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/page.tsx` | Awaited `params` in `generateMetadata` and used resolved `id` to build canonical + OG image URLs and to fetch place details via tRPC. |

## Key Decisions

- Treated `params` as a `Promise` in Next.js 16/Turbopack for this route, matching the existing pattern already used in `src/app/(public)/courts/[id]/opengraph-image.tsx`.
- Kept metadata fallback values in place to avoid breaking crawlers if the tRPC call fails.

## Next Steps (if applicable)

- [ ] Redeploy and re-scrape the URL in Facebook Sharing Debugger / Twitter Card Validator (OG caches).
- [ ] (Optional) If you want canonical URLs to be `www`, ensure `NEXT_PUBLIC_APP_URL=https://www.kudoscourts.com`.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
