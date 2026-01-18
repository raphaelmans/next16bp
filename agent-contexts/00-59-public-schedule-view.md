# [00-59] Public Schedule View + Detail CTA

> Date: 2026-01-18
> Previous: 00-58-public-navbar-consistency.md

## Summary

Added a secondary CTA on the public court detail page to open a new dedicated schedule page, while keeping the existing booking flow unchanged. Implemented a public `/courts/[id]/schedule` route (with a `/places/[placeId]/schedule` alias) that preserves selection state via query params and funnels into the existing booking step.

## Changes Made

### Planning

| File | Change |
|------|--------|
| `agent-plans/40-public-schedule-view/40-00-overview.md` | Created master plan for schedule view + CTA |
| `agent-plans/40-public-schedule-view/40-01-routing-and-cta.md` | Phase 1 plan (routing + CTA) |
| `agent-plans/40-public-schedule-view/40-02-schedule-page-v1.md` | Phase 2 plan (schedule page v1) |
| `agent-plans/40-public-schedule-view/40-03-polish-and-validation.md` | Phase 3 plan (polish + validation) |
| `agent-plans/40-public-schedule-view/public-schedule-view-dev1-checklist.md` | Dev checklist |
| `agent-plans/context.md` | Logged the new plan in changelog |

### Routing

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Added `appRoutes.courts.schedule()` and `appRoutes.places.schedule()` |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | New public schedule route page |
| `src/app/(public)/places/[placeId]/schedule/page.tsx` | Alias route re-exporting the court schedule page |

### UI

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Added secondary CTA "See full schedule" in booking summary; carries selection state via query params |

### Tooling / Hygiene

| File | Change |
|------|--------|
| `biome.json` | Increased `files.maxSize` to allow linting large JSON assets |
| `src/components/form/fields/StandardFormSelect.tsx` | Fixed quote style to satisfy formatter |
| `public/assets/files/ph-provinces-cities*.json` | Biome format applied (unrelated but required for passing checks) |
| `public/assets/files/philippines-addresses.json` | Biome format applied (unrelated but required for passing checks) |

## Key Decisions

- Used query params (nuqs) to preserve schedule state for shareable URLs and reliable back/forward navigation.
- Used a place-local day key (`yyyy-MM-dd`) for the schedule link to avoid timezone day-boundary bugs.
- Kept teal as the primary booking CTA; used a secondary link-style CTA for the new schedule entry point, aligning with the design system.

## Next Steps

- [ ] If desired, evolve the schedule page UI into a true multi-court time grid (booked/held/available) to match the referenced screenshot.
- [ ] Consider extracting URL building into a shared helper to reduce duplication between detail and schedule pages.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
pnpm dev
```
