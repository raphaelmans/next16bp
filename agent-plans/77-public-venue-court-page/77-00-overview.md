# Public Venue Court Page (Detail + Availability)

Status: draft

## Overview

Add a new public, indexable court-specific page under a venue:

- Route: `/venues/<venueSlug>/courts/<courtId>`

This page combines:

- Venue detail context (derived from `place.getByIdOrSlug`, like `src/app/(public)/courts/[id]/page.tsx` → `src/app/(public)/places/[placeId]/page.tsx`)
- Court-scoped availability browsing (month/day patterns from `src/app/(public)/courts/[id]/schedule/page.tsx`, but embedded in this route and scoped to one court)

This is related in spirit to `agent-plans/75-owner-bookings-playground-dnd/75-00-overview.md` (calendar-first UX + URL-driven state), but this plan is **public booking**, not owner studio, and uses only month/day availability patterns.

## Problem

- Public `src/app/(public)/courts/[id]/page.tsx` is a legacy alias to the *venue* detail page (not a “court entity” page).
- The dense public schedule page is a separate route (`/venues/[slug]/schedule`) and is `noindex`.
- There is no canonical, shareable URL to view a **specific court** within a venue and browse its availability with month/day controls.

## Goals

- Provide `/venues/<venueSlug>/courts/<courtId>`.
- Show court-focused details (label/tier/sport) with enough venue context (name/location + link back to venue detail).
- Embed availability browsing on the same page (month/day), scoped to the court.
- Drive state via URL query params (nuqs) for shareable deep links.
- Use the installed Motion for React package (`motion`) for subtle transitions (day ↔ month) with reduced-motion support.
- Keep place time zone canonical for all date math.

## Non-goals

- Week-grid schedule (pseudocode week view) for v1.
- New booking flow; continue using existing `/venues/[slug]/book`.
- New backend availability endpoints (reuse existing `availability.getForCourt*`).

## Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Related plan (schedule view) | `agent-plans/40-public-schedule-view/40-00-overview.md` |
| Related plan (month view) | `agent-plans/54-public-schedule-month-view/54-00-overview.md` |
| Related plan (owner motion patterns) | `agent-plans/75-owner-bookings-playground-dnd/75-07-week-month-views-motion.md` |
| Existing pages | `src/app/(public)/places/[placeId]/page.tsx`, `src/app/(public)/courts/[id]/schedule/page.tsx` |
| Motion docs | https://motion.dev/docs/react/motion-component , https://motion.dev/docs/react/animate-presence , https://motion.dev/docs/react/use-reduced-motion |

## URL Contract

- Path params:
  - `venueSlug`: slug or UUID for place (existing convention)
  - `courtId`: UUID

- Query params (nuqs, shareable state):
  - `view`: `"month" | "day"` (default `month`)
  - `month`: `yyyy-MM` (used in month view)
  - `date`: dayKey `yyyy-MM-dd` in place time zone (used in day view, and as focus in month view)
  - `duration`: minutes (default 60)
  - `startTime`: ISO string (selected slot)

Notes:

- Canonical URL should exclude query params (`alternates.canonical`).
- Query params are allowed for deep links and should be preserved during canonical slug redirects.

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Shared routing contract + server route + metadata | 1A | Yes |
| 2 | Client page + court-scoped availability panel + Motion transitions | 2A | Partial |
| 3 | QA + polish | 3A | No |

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Route + canonical + metadata | Dev 1 | `77-01-route-and-metadata.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Court page UI + availability panel | Dev 1 | `77-02-frontend-court-page.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | QA + polish | Dev 1 | `77-03-qa.md` |

## Workstreams

### Shared / Contract

- [ ] Add `appRoutes.places.courts.detail(venueSlugOrId, courtId)` route helper.
- [ ] Define query param contract (`view`, `month`, `date`, `duration`, `startTime`) and defaulting rules.
- [ ] Define canonicalization rules (slug redirect, query param preservation, 404 behavior).

### Server / Backend

- [ ] N/A (no new endpoints). Use existing `place.getByIdOrSlug` and availability endpoints.

### Client / Frontend

- [ ] Create new public page route at `src/app/(public)/venues/[venueSlug]/courts/[courtId]/page.tsx`.
- [ ] Render court-focused header + venue context.
- [ ] Implement month/day availability browsing scoped to `courtId`.
- [ ] Implement booking CTA to existing `/venues/[slug]/book?...` flow.
- [ ] Add Motion transitions for view switching (`motion/react` + `AnimatePresence`) with reduced-motion support.

## UX (ASCII)

Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ Back to venue   Venue Name                                   │
│ Court Label  [Sport] [Tier]                                  │
│ City, Province   (optional: Open full venue details)          │
├──────────────────────────────────────────────────────────────┤
│ Schedule (month/day)                                         │
│ [Month|Day] [Duration] [Date picker (day)]                    │
│                                                              │
│ Month view: AvailabilityMonthView                             │
│ Day view: TimeSlotPicker                                      │
├──────────────────────────────────────────────────────────────┤
│ Selection bar: Selected time + price     [Clear] [Continue]   │
└──────────────────────────────────────────────────────────────┘
```

Mobile

- Same content, with existing sticky bottom CTA pattern (like public schedule page).

## Success Criteria

- [ ] `/venues/<venueSlug>/courts/<courtId>` renders with court + venue context.
- [ ] Month/day availability works and is scoped to the court.
- [ ] URL query params deep-link correctly and survive refresh.
- [ ] Booking CTA routes to `/venues/<slug>/book?...` with correct params and guest login return-to works.
- [ ] Motion transitions work and respect reduced motion.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
