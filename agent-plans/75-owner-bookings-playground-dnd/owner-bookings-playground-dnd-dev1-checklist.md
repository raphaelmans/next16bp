# Dev1 Checklist: Owner Availability Studio (DnD)

## Shared / Contract

- [ ] Confirm URL params: `placeId`, `courtId`, `dayKey`, `view`, optional `jobId`.
- [ ] Confirm `view` values include `week` + `month` and decide the default.
- [ ] Confirm week start (Mon vs Sun) and ensure month grid aligns.
- [ ] Define `DragItem` payload union and droppable id format.

## Server / Backend

- [ ] Phase 1-2: N/A.
- [ ] (Optional Phase 3) Implement `courtBlock.updateRange`.

## Client / Frontend

- [ ] Add `/owner/bookings` page (bento layout: month nav + timeline + inspector).
- [ ] Venue selector (owner places).
- [ ] Court selector (owner courts per place).
- [ ] Day selection via month calendar.
- [ ] Phase 7: Week view (7-day grid) + Month view (month grid picker).
- [ ] Phase 7: Animate week↔month using Motion for React (`motion/react`) + `useReducedMotion()`.
- [ ] Phase 8: Week blocks are interactive (move + resize + remove) using `TimelineBlockItem` overlay, not indicators.
- [ ] Phase 8: Add remove action on the block card (trash/remove) and ensure it does not start a drag.
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
- [ ] Phase 7: verify reduced-motion behavior for view transitions.
- [ ] Phase 8: verify week move/resize/remove parity with Day view.

## Phase 6: Optimistic + Polish

- [ ] Add optimistic updates for block create/move/resize/cancel in `src/app/(owner)/owner/bookings/page.tsx`.
- [ ] Add optimistic updates for import overlay row drag in `src/app/(owner)/owner/bookings/page.tsx`.
- [ ] Refine block + draft styling to reduce contrast (neutral cards + accent stripe + badges).
- [ ] Re-run `pnpm lint` and `TZ=UTC pnpm build`.
