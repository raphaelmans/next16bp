# Phase 4: Import Overlay Mode (Drag Draft Rows To Fix)

**Dependencies:** Phase 2 (DnD foundations) and bookings import review/commit exists (`agent-plans/71-bookings-import-review-commit/`)  
**Parallelizable:** Yes (can be built while Phase 3 is deferred)  
**User Stories:** 66-02

---

## Objective

Make import correction calendar-first:

- From an import job, owner opens the studio with `jobId`.
- Draft rows render as draggable “ghost blocks”.
- Owner can drop a draft row onto a timeline cell to set/fix its time.
- Commit from the studio uses the existing import commit endpoint.

---

## UX

When `jobId` is present:

- Show an “Import Job Banner” with counts (valid/errors/committed).
- Add an Import Drafts section in the sidebar:
  - List error rows first.
  - Each row is draggable (dragging changes its time).
- Timeline renders draft rows as a distinct style (tinted, dashed border).

Deep links:

- Import review page adds a CTA: “Fix in studio”.

---

## Drag Contract

Draggable draft row payload:

- `kind: "draft-row"`
- `jobId`
- `rowId`
- optional `durationMinutes` if available, else infer from row start/end

Drop target:

- Same timeline cell format (`timeline-cell:${dayKey}:${startMinute}`)

On drop:

- Update the row’s start/end to match dropped time (preserve duration).
- Call `bookingsImport.updateRow`.

---

## Commit

- Provide a primary CTA “Commit” (disabled if any blocking errors remain).
- Call existing `bookingsImport.commit({ jobId })`.

---

## Workstreams

### Shared / Contract

- [ ] Define overlay query param (`jobId`) and how it changes available UI.
- [ ] Define draft row draggable payload.

### Server / Backend

- [ ] N/A (reuse bookings import endpoints).

### Client / Frontend

- [ ] Add banner + sidebar list for draft rows.
- [ ] Render ghost blocks in the timeline.
- [ ] Drop -> `bookingsImport.updateRow` -> invalidate.
- [ ] Add commit CTA wired to `bookingsImport.commit`.
