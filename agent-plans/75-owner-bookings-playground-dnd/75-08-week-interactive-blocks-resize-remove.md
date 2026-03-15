# Phase 8: Week View Interactive Blocks (Resize + Remove)

Status: draft

## Problem

Week view currently renders blocks as **non-interactive indicators** inside hour cells. This causes regressions:

- No resize-by-dragging in Week view
- No remove/cancel action in Week view (unless switching to Day inspector)
- Limited discoverability of block interactions

## Goal

Bring Week view block interactions to parity with Day view:

- Move: drag a block to a different day/time
- Resize: drag start/end handles to expand/shrink (60-minute snapping)
- Remove: cancel a block directly from the block card

## Non-goals

- Redesign of underlying block model
- Supporting arbitrary minute granularity (stay at 60m)

## Workstreams

### Shared / Contract

- [ ] Confirm Week supports the same actions as Day: move + resize + remove.
- [ ] Confirm remove semantics: remove == `courtBlock.cancel`.

### Server / Backend

- [ ] N/A (reuse existing `courtBlock.cancel` and existing update-range endpoint if already present)

### Client / Frontend

## Current Implementation Notes (Repo)

- Day view supports cancel via the Day-side list/inspector "Remove" button (calls `handleCancelBlock` → `courtBlock.cancel`).
- Week view renders blocks inside per-hour cells (indicator-style) and does not surface a cancel action.

#### 1) Replace indicator-only rendering

- Replace `WeekTimelineCell` (indicator-only) with a `WeekDayColumn` component.
- `WeekDayColumn` responsibilities:
  - render droppable hour rows for hit-testing (`TimelineDropRow` per hour)
  - render an overlay layer that places real blocks using `TimelineBlockItem`
  - render import overlay draft blocks (non-interactive overlay)

Layout recommendation:

- Grid remains: `time-label column + 7 day columns`.
- Each day column is a `relative` container:
  - base: stacked droppable rows
  - overlay: `absolute inset-0` with `pointer-events-none`
    - each `TimelineBlockItem` sets `pointer-events-auto` (already) for interaction

#### 2) Resize handles in Week

- `TimelineBlockItem` already contains `ResizeHandle` components.
- Ensure that Week overlay uses the same `TimelineBlockItem` so resize works.
- If blocks can overlap midnight:
  - Only show the **start** handle on the day segment that contains the block’s actual start.
  - Only show the **end** handle on the day segment that contains the block’s actual end.
  - Middle-day segments show no handles.

#### 3) Remove button on the block card

- Add a small remove/trash button to `TimelineBlockItem`:
  - on click: call `handleCancelBlock(block.id)`
  - prevents drag-start: stopPropagation + preventDefault on pointer down/click
  - hover/focus-visible reveal; always visible on touch (`@media (hover: none)`)

Drag-safety details:

- Prefer a dedicated drag handle (attach `listeners` only to the handle) so the remove button never triggers a drag.
- If keeping `listeners` on a container, the remove button must stop propagation early:
  - `onPointerDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}`
  - `onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}`

#### 4) QA for Week interactions

- Move in Week view: drag block → drops into another day/time
- Resize in Week view: drag handles → updates start/end
- Remove in Week view: click remove button → cancels block
- Still works in Day view (no regressions)

## Verification

- `pnpm lint`
- `pnpm build`
- `TZ=UTC pnpm build`

Manual:

- Week: move/resize/remove all function
- Month: DnD disabled; selecting a day returns to Week
