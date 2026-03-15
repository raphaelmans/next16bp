# Phase 2: DnD Palette -> Create Blocks (Auto-Create + Undo)

**Dependencies:** Phase 1 route shell exists  
**Parallelizable:** Yes (can be built while Phase 1 UI polish continues)  
**User Stories:** 05-03, 05-04

---

## Objective

Implement a drag-and-drop “Block Palette” so owners can:

- Drag a preset widget (e.g., 1h maintenance) onto a day timeline.
- Auto-create the corresponding block on drop.
- Undo via toast action (calls cancel).

This phase intentionally avoids “drag in empty space to create” and instead uses sidebar widgets as the primary creation affordance.

---

## Dependencies (Library)

Add:

- `@dnd-kit/core`
- `@dnd-kit/modifiers`
- `@dnd-kit/utilities`

Docs references:

- `DndContext` and `DragOverlay`: https://docs.dndkit.com/
- Sensors (`PointerSensor`, `TouchSensor`, `KeyboardSensor`) and `useSensors`.
- Modifiers (e.g., `restrictToVerticalAxis`).

---

## Drag Contract (Type-Safe Payload)

Define a narrow set of draggable items:

- Preset widgets
  - `blockType`: `MAINTENANCE` | `WALK_IN`
  - `durationMinutes`: `60 | 120 | 180 | 240` (v1: start with 60/120)
  - optional `reasonPreset`

Droppable targets:

- Timeline “hour cells” identified by:
  - `timeline-cell:${dayKey}:${startMinute}`

This cell-based approach gives snapping “for free” (no pixel-to-time math needed in v1).

---

## Drop -> Create Algorithm

On `onDragEnd({ active, over })`:

1. If `over` is null: no-op.
2. If `active` is not a preset: no-op.
3. Parse droppable id -> `dayKey + startMinute`.
4. Build a zoned start time (place time zone):
   - `dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start`
   - `start = new Date(dayStart.getTime() + startMinute * 60_000)`
   - `end = new Date(start.getTime() + durationMinutes * 60_000)`
5. Call the correct mutation:
   - maintenance -> `trpc.courtBlock.createMaintenance`
   - walk-in -> `trpc.courtBlock.createWalkIn`
   - Inputs use UTC iso strings (`toUtcISOString(start)` / `toUtcISOString(end)`).
6. On success:
   - invalidate day/month queries
   - toast with Undo action -> call `trpc.courtBlock.cancel({ blockId })`
7. On failure (overlap/reservation conflict):
   - show toast error
   - no optimistic UI is required for v1.

---

## Sensors + Modifiers (Recommended)

- Sensors:
  - Pointer
  - Touch (with press delay)
  - Keyboard (for accessibility)
- Modifiers:
  - `restrictToVerticalAxis` on the day timeline to reduce accidental horizontal drift.

---

## UI Details

Sidebar palette:

- Small set of presets (avoid clutter):
  - 1h Maintenance
  - 2h Maintenance
  - 1h Walk-in
  - Custom… (opens existing dialog)

Toast:

- After create: "Block created" with an `Undo` action.

---

## Workstreams

### Shared / Contract

- [ ] Define `DragItem` union type for palette items.
- [ ] Define droppable id format + parsing helpers.

### Server / Backend

- [ ] N/A (use existing create + cancel endpoints).

### Client / Frontend

- [ ] Add Block Palette UI (draggables).
- [ ] Add timeline hour-cells as droppables.
- [ ] Wire `DndContext` with sensors + `DragOverlay`.
- [ ] Implement drop -> create -> toast Undo -> invalidate.
