# [00-54] Courts Copywriting

> Date: 2026-01-17
> Previous: 00-53-ph-location-standardization.md

## Summary

Updated public-facing copy to make courts the primary concept and venues the supporting term, and aligned public navigation links to `/courts` where applicable. Added planning artifacts for the copywriting rollout.

## Changes Made

### Public Copy Updates

| File | Change |
|------|--------|
| `src/app/page.tsx` | Court-first landing hero, search copy, and CTAs. |
| `src/features/discovery/components/hero-section.tsx` | Courts-first hero messaging and search placeholder. |
| `src/app/(public)/courts/page.tsx` | Courts wording for headers and results count. |
| `src/features/discovery/components/empty-results.tsx` | “No courts found” + courts CTA. |
| `src/features/discovery/components/court-map.tsx` | Map empty state now references courts. |
| `src/features/discovery/components/navbar.tsx` | “List Your Venue” + “Search courts” + “Browse Courts”. |
| `src/features/discovery/components/footer.tsx` | Courts/venue labels in discovery + owner links. |
| `src/app/(public)/places/[placeId]/page.tsx` | Venue-focused not-found and claim copy. |

### Navigation/Link Adjustments

| File | Change |
|------|--------|
| `src/shared/components/kudos/place-card.tsx` | Court detail links use `/courts/:id`. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/36-public-copywriting/36-00-overview.md` | Public copywriting plan overview. |
| `agent-plans/36-public-copywriting/36-01-public-copy-updates.md` | Discovery copy plan. |
| `agent-plans/36-public-copywriting/36-02-venue-detail-copy.md` | Venue detail copy plan. |
| `agent-plans/36-public-copywriting/public-copy-dev1-checklist.md` | Dev checklist. |
| `agent-plans/user-stories/18-public-copywriting/18-00-overview.md` | User stories overview. |
| `agent-plans/user-stories/18-public-copywriting/18-01-court-first-public-copy.md` | Court-first copy story. |
| `agent-plans/context.md` | Logged plan entry. |

## Key Decisions

- “Courts” is the primary public-facing term; “Venue” is reserved for container/claim copy.
- Public CTAs and links point to `/courts` for discovery.

## Next Steps (if applicable)

- [ ] Run `pnpm build` if you want a verification pass.

## Commands to Continue

```bash
pnpm build
```
