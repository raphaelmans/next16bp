# [01-32] Public Venue Court Proxy Rewrite

> Date: 2026-01-29
> Previous: 01-31-public-venue-court-route-param.md

## Summary

Fixed a 404 for the new public nested court page by aligning the filesystem route with the repo’s `/venues` → `/places` proxy rewrite behavior.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(public)/places/[placeId]/courts/[courtId]/page.tsx` | Ensured the nested court page is available under the filesystem path used by the proxy rewrite. |
| `src/app/(public)/places/[placeId]/courts/[courtId]/court-detail-client.tsx` | Moved/updated client component accordingly. |

## Key Decisions

- Keep public URLs canonical under `/venues/...` while serving them via filesystem routes under `/places/...` because `src/proxy.ts` rewrites `/venues/*` → `/places/*`.

## Next Steps (if applicable)

- [ ] Consider adding a small note in the relevant agent plan about the `/venues` proxy rewrite so future routes follow the same convention.

## Commands to Continue

```bash
pnpm dev
pnpm lint
```
