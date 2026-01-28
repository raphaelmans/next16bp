# Dev1 Checklist: Owner Bookings Playground (DnD)

## Shared / Contract

- [ ] Confirm URL params: `placeId`, `courtId`, `dayKey`, `view`, optional `jobId`.
- [ ] Define `DragItem` payload union and droppable id format.

## Server / Backend

- [ ] Phase 1-2: N/A.
- [ ] (Optional Phase 3) Implement `courtBlock.updateRange`.

## Client / Frontend

- [ ] Add `/owner/bookings` page (bento layout: month nav + timeline + inspector).
- [ ] Venue selector (owner places).
- [ ] Court selector (owner courts per place).
- [ ] Day selection via month calendar.
- [ ] Timeline rendering for existing blocks (selected day).
- [ ] Block Palette presets:
  - [ ] 1h Maintenance
  - [ ] 2h Maintenance
  - [ ] 1h Walk-in
  - [ ] Custom… (opens dialog)
- [ ] dnd-kit wiring:
  - [ ] sensors (pointer/touch/keyboard)
  - [ ] `restrictToVerticalAxis`
  - [ ] `DragOverlay`
- [ ] Drop -> create mutation -> invalidate -> toast Undo.
- [ ] Undo -> cancel mutation -> invalidate.

## QA

- [ ] Run through `agent-plans/75-owner-bookings-playground-dnd/75-05-qa.md`.
