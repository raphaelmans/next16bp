# Phase 5: Place Detail Batching (Conflict Control)

**Dependencies:** Plan 44 guest removal work touches place detail page  
**Parallelizable:** No

---

## Objective

Reduce merge conflicts and UI regressions by batching edits to the hot-spot file:
- `src/app/(public)/places/[placeId]/page.tsx`

This file is shared by `/places/[placeId]` and `/courts/[id]` (re-export).

---

## Strategy

- Prefer a single PR for:
  - Resume-after-login fix
  - Mobile sticky CTA (if touching the same sections)
  - Guest removal card placement alignment

- Avoid adding duplicate cards/CTAs in the same sidebar stack.

---

## Checklist

- [ ] Confirm card ordering (claim, removal, booking summary, location, "what happens next").
- [ ] Ensure bookable vs curated states are still clear.
- [ ] Re-run `pnpm lint` + `TZ=UTC pnpm build`.
