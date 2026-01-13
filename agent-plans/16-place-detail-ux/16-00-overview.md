# Place Detail UX - Master Plan

## Overview

Improve the desktop booking flow on the place detail page while keeping the gallery-first layout. Add clear scroll affordances, sticky summary guidance, and a guided CTA to lead users to available times.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| UX Target | `src/app/(public)/places/[placeId]/page.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Gallery-first UX improvements | 1A | Yes |

---

## Module Index

### Phase 1: Gallery-first UX improvements

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Gallery overlay + guided booking summary | Agent | `16-01-place-detail-ux.md` |

---

## Dependencies Graph

```
Phase 1 ───── Gallery-first UX improvements
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Gallery-first | Preserve visual emphasis while improving guidance |
| Primary affordance | Overlay CTA + guided summary button | Make next step explicit without reordering content |
| Scroll behavior | Smooth scroll (respect reduced motion) | Provide clear navigation without jank |

---

## Document Index

| Document | Description |
|----------|-------------|
| `16-00-overview.md` | Master plan |
| `16-01-place-detail-ux.md` | Phase 1 details |
| `place-detail-ux-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Booking summary CTA never dead-ends without guidance.
- [ ] Gallery overlay CTA scrolls to availability.
- [ ] Desktop users see clear path to time selection.
- [ ] Lint/build pass.
