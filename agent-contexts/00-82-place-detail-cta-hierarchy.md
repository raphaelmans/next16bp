# [00-82] Place Detail CTA Hierarchy

> Date: 2026-01-21
> Previous: 00-81-select-defaults-async.md

## Summary

Rebalanced the place detail page to keep player-first actions prominent while pushing owner/admin tools into a subtle, collapsible section for non-bookable venues. Added contextual hero CTAs and cleaned up the gallery interaction to avoid nested interactive elements.

## Changes Made

### UI/UX

| File | Change |
| --- | --- |
| `src/app/(public)/places/[placeId]/page.tsx` | Reordered sidebar cards, added Venue tools accordion, added hero CTAs for directions/call, adjusted copy for reporting. |
| `src/features/discovery/components/photo-gallery.tsx` | Swapped the main photo click target to an overlay button with proper layering and group hover. |

## Key Decisions

- Group claim/removal actions into a single "Venue tools" accordion so they stay discoverable but visually secondary.
- Add directions/call CTAs in the hero when bookings are unavailable to preserve the player journey.

## Next Steps (if applicable)

- [ ] Smoke test the non-booking page on mobile and desktop.
- [ ] Run `pnpm lint` if additional validation is needed.

## Commands to Continue

```bash
pnpm lint
```
