# [01-81] Place Detail Composition Pass

> Date: 2026-02-10
> Previous: 01-80-free-reservation-branding.md

## Summary

Refactored the public place detail route into a thin client entry that delegates to a new feature-scoped `place-detail` module. Extracted semantic booking/listing-help/desktop-mobile composition boundaries to reduce root-level churn and prepare cleaner query/state ownership.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Replaced the large route-local implementation with a thin wrapper that renders `PlaceDetailPageView` from the feature module. |
| `src/features/discovery/place-detail/place-detail-page-view.tsx` | Added the new composition root for place detail and centralized section-level orchestration. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-section.tsx` | Added booking section boundary to contain availability/selection behavior in a semantic section. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` | Added desktop-specific booking composition section. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Added mobile-specific booking composition section. |
| `src/features/discovery/place-detail/components/sections/place-detail-listing-help-section.tsx` | Added listing-help section boundary for claim/removal workflows. |
| `src/features/discovery/place-detail/components/place-detail-sidebar.tsx` | Added sidebar composition module aligned with section ownership. |
| `src/features/discovery/place-detail/components/place-detail.tsx` | Added/updated feature component exports and composition wiring. |
| `src/features/discovery/place-detail/components/place-detail-availability-desktop.tsx` | Added desktop availability presentation module under feature scope. |
| `src/features/discovery/place-detail/components/place-detail-mobile-sheet.tsx` | Added mobile sheet presentation module under feature scope. |
| `src/features/discovery/place-detail/components/place-detail-booking-summary-card.tsx` | Added booking summary card module for sidebar/CTA surface. |
| `src/features/discovery/place-detail/components/place-detail-next-steps-card.tsx` | Added next-steps card module for booking flow support. |
| `src/features/discovery/place-detail/components/place-detail-listing-help-card.tsx` | Added listing-help card module for claim/removal prompts. |
| `src/features/discovery/place-detail/components/place-detail-location-card.tsx` | Added location card module. |
| `src/features/discovery/place-detail/components/place-detail-contact-card.tsx` | Added contact card module. |
| `src/features/discovery/place-detail/components/place-detail-courts-card.tsx` | Added courts card module. |
| `src/features/discovery/place-detail/components/place-detail-hero.tsx` | Added place hero module. |
| `src/features/discovery/place-detail/components/place-detail-skeleton.tsx` | Added skeleton/loading module for place detail surfaces. |
| `src/features/discovery/place-detail/forms/schemas.ts` | Added place-detail form schemas. |
| `src/features/discovery/place-detail/hooks/use-place-detail-availability-selection.ts` | Added feature-scoped availability selection hook. |
| `src/features/discovery/place-detail/hooks/use-mobile-week-prefetch.ts` | Added mobile prefetch behavior hook. |
| `src/features/discovery/place-detail/state/place-detail-url-state.ts` | Added URL state handling for place detail selection. |
| `src/features/discovery/place-detail/state/place-detail-ui-store.ts` | Added/updated ephemeral UI store for place detail interactions. |
| `src/features/discovery/place-detail/index.ts` | Added feature barrel export for place detail module. |

### Planning

| File | Change |
|------|--------|
| `.opencode/plans/1770719331480-jolly-river.md` | Added the implementation plan for the final place-detail composition pass and semantic section ownership. |

## Key Decisions

- Kept `src/app/(public)/places/[placeId]/place-detail-client.tsx` as a route-only shell to follow route-vs-feature separation conventions.
- Introduced semantic section boundaries (booking, listing help, sidebar) so high-churn query/form/mutation state can live closer to where it is rendered.
- Split desktop and mobile booking flows into separate section modules while keeping shared feature-level primitives.
- Established feature-local hooks/state (`hooks/`, `state/`, `forms/`) under `src/features/discovery/place-detail` to reduce root prop drilling and improve maintainability.

## Next Steps

- [ ] Run `pnpm lint` and resolve any issues introduced by the refactor.
- [ ] Manually verify booking flows on desktop/mobile (sport/court switching, day/week transitions, reserve CTA).
- [ ] Manually verify listing-help claim/removal interactions and dialog submit states.
- [ ] Confirm no behavioral regressions in analytics events tied to schedule selection and reserve/login funnels.

## Commands to Continue

```bash
git status --short
pnpm lint
pnpm dev
```
