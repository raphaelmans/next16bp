# Owner Availability Studio (DnD Blocks + Import Overlay)

Status: draft

## Problem

Owner schedule management is split across multiple UI surfaces:

- Court availability management is functional but form/dialog-driven and court-scoped (`/owner/places/.../availability`).
- Booking import corrections are table-driven and job-scoped (`/owner/import/bookings/[jobId]`).

This makes “day ops” (quickly placing and correcting blocks) slow, and makes import correction harder because it lacks calendar context.

## Goals

- Add an owner-facing “Availability Studio” surface optimized for big screens:
  - Select venue -> select court -> manage a day via a timeline editor.
- Add a drag-and-drop palette (widgets) to place blocks:
  - Drag preset widgets (e.g., 1h maintenance, 2h maintenance, 1h walk-in) onto a day timeline.
  - Auto-create on drop.
  - Show toast with Undo (cancel) after creation.
- Reuse existing backend primitives where possible (court blocks + bookings import draft rows).
- Keep place time zone canonical for all date/time input and rendering.
- Provide an “import overlay mode” that makes import correction calendar-first:
  - Deep-link from import review to the studio.
  - Show draft rows as draggable “ghost blocks” until committed.

## Non-goals

- Multi-court grid (drag across courts) in v1.
- 15/30-minute granularity in v1 (stick to 60-minute snapping to match validation).
- Editing real reservations (cancel/reschedule) inside the timeline editor.
- Screenshot (image) import normalization (tracked separately in `agent-plans/71-bookings-import-review-commit/71-06-screenshot-normalization.md`).

## References

- Design system: `business-contexts/kudoscourts-design-system.md`
- Existing blocks UI: `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`
- Blocks module: `src/modules/court-block/court-block.router.ts`
- Import review UI: `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`
- Import module: `src/modules/bookings-import/services/bookings-import.service.ts`
- Existing plans:
  - `agent-plans/67-owner-court-blocks/67-00-overview.md`
  - `agent-plans/71-bookings-import-review-commit/71-00-overview.md`
  - `agent-plans/70-bookings-import-owner-ui/70-00-overview.md`
- User stories:
  - `agent-plans/user-stories/05-availability-management/05-03-owner-blocks-time-range-maintenance.md`
  - `agent-plans/user-stories/05-availability-management/05-04-owner-creates-walk-in-booking-block.md`
  - `agent-plans/user-stories/66-bookings-import/66-02-owner-reviews-and-commits-imported-bookings.md`
- DnD library: https://docs.dndkit.com/

## Phases

1. **Studio route + layout shell**: new owner route with venue/court selectors and calendar-first bento layout.
2. **DnD palette -> create blocks**: drag preset widgets onto a day timeline; auto-create + Undo.
3. **Drag to move/resize blocks** (optional, gated): requires new backend update endpoint.
4. **Import overlay mode**: drag draft rows onto timeline to fix times (and later court); commit from the studio.
5. **QA + polish**: accessibility, reduced motion, error handling, performance.

## Workstreams

### Shared / Contract

- [ ] Define URL contract for studio state:
  - `placeId`, `courtId`, `dayKey`, `view`, optional `jobId`.
- [ ] Define drag payload shapes (type-safe) for dnd-kit:
  - preset widgets (maintenance/walk-in) and import draft rows.
- [ ] Define “Undo” semantics:
  - Create returns `blockId`.
  - Undo calls `courtBlock.cancel`.
- [ ] (Phase 3) Define `courtBlock.updateRange` contract (input/output/errors).

### Server / Backend

- [ ] Phase 1-2: N/A (reuse existing `courtBlock.createMaintenance`, `courtBlock.createWalkIn`, `courtBlock.cancel`).
- [ ] Phase 3: add `courtBlock.updateRange` (reschedule) endpoint with overlap checks (excluding the same block).
- [ ] Phase 4: N/A (reuse `bookingsImport.updateRow`, `bookingsImport.commit`, `bookingsImport.listRows`).

### Client / Frontend

- [ ] Add `owner/bookings` studio route (venue/court selectors, day timeline, inspector).
- [ ] Build Day Timeline editor component (hour grid, block rendering, time zone display).
- [ ] Add dnd-kit integration:
  - drag preset -> drop to create -> toast with Undo.
- [ ] Phase 4: import overlay mode (draft rows rendered as draggable “ghost blocks”).

## Success Criteria

- Owner can select venue + court and manage a day on a single “big screen” surface.
- Owner can drag a 1h/2h maintenance widget onto a day and it creates a maintenance block.
- Owner can drag a walk-in widget onto a day and it creates a walk-in block.
- After drop-create, Undo reliably cancels the created block.
- Import review can deep-link into the studio with job overlay and owners can correct draft rows in calendar context.
