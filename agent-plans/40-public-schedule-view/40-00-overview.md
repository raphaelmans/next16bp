# Public Schedule View + Detail CTA - Master Plan

## Overview

Add a secondary call-to-action on the public court/place detail page to open a new detailed schedule view.

The existing booking flow remains unchanged:
- The default detail page continues to support: sport -> court mode -> duration -> date -> time selection -> checkout.
- The new detailed schedule view is an additional path that surfaces availability per court in a denser layout.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Existing Detail Page | `src/app/(public)/places/[placeId]/page.tsx` |
| Booking Step 2 | `src/app/(auth)/places/[placeId]/book/page.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Routing + CTA | 1A | Yes |
| 2 | Detailed schedule page v1 | 2A | Partial |
| 3 | Polish + validation | 3A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Add public schedule route + route helpers + CTA on detail page | Agent | `40-01-routing-and-cta.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Implement schedule page UI + query param sync + reserve navigation | Agent | `40-02-schedule-page-v1.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | UI polish, a11y pass, lint/build validation | Agent | `40-03-polish-and-validation.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL state | Query params via nuqs | Repo standard; supports sharing and back/forward |
| Day representation | `yyyy-MM-dd` dayKey in place timezone | Stable + easy to parse; avoids timezone off-by-one |
| Data source | `availability.getForCourt` per court in parallel | No backend changes; enables per-court columns |
| CTA styling | Secondary (outline/link) using accent color | Preserve teal for primary action (design system) |

---

## Success Criteria

- [ ] Existing booking flow unchanged on `/courts/[id]`.
- [ ] New secondary CTA navigates to `/courts/[id]/schedule` and preserves current selections.
- [ ] Schedule page renders availability for multiple courts and can start checkout.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
