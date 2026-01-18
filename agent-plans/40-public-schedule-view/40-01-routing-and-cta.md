# Phase 1: Routing + CTA

**Dependencies:** None
**Parallelizable:** Yes

---

## Objective

Introduce a new public schedule route and add a secondary CTA on the existing detail page that links to it while preserving current selection state.

---

## Module 1A: Add public schedule route + route helpers + CTA

### Routes

- Add new public schedule page:
  - `src/app/(public)/courts/[id]/schedule/page.tsx`

- Optional alias (recommended for symmetry):
  - `src/app/(public)/places/[placeId]/schedule/page.tsx` re-exporting the courts schedule page.

### Route helpers

Update `src/shared/lib/app-routes.ts`:

- Add `appRoutes.courts.schedule(courtId: string): string` -> `/courts/${courtId}/schedule`
- (Optional) add `appRoutes.places.schedule(placeId: string): string` -> `/places/${placeId}/schedule`

### CTA placement

Update `src/app/(public)/places/[placeId]/page.tsx`:

- Add a secondary CTA near the existing booking summary primary CTA.
- Label: "View schedule" / "See full schedule" (final label decided in implementation based on fit).
- Behavior:
  - Navigates using `next/link` to the new schedule route.
  - Includes query params:
    - `date`: `yyyy-MM-dd` day key (place timezone)
    - `sportId`
    - `mode` (`any` | `court`)
    - `courtId` (if mode is `court`)
    - `duration` (minutes)
    - `startTime` (optional if a slot is selected)

### A11y

- Ensure the CTA is a real link (`Link`) and has a clear accessible name.
- No icon-only buttons without `aria-label`.

---

## Testing Checklist

- [ ] Navigate `/courts/<id>` and verify the new CTA exists.
- [ ] Change sport/duration/date/court and verify CTA URL updates.
- [ ] Click CTA and confirm it lands on `/courts/<id>/schedule`.
- [ ] Back button returns to previous page and preserves state.
