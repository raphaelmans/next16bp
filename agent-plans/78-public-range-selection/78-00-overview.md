# Public Booking Range Selection (Adjacent Slots)

Status: draft

## Overview

Add a player-facing “select a time block” interaction that supports booking adjacent hourly slots as a **single reservation** (still `startTime + durationMinutes`) using a studio-like drag-to-select timeline.

Scope is **adjacent / contiguous only** (same day). This is not a cart, not multi-day repeat booking, and not disjoint selections.

## Problem

- The booking backend already supports multi-hour contiguous reservations via `durationMinutes`.
- The public schedule UIs are single-select (one start time). Users must adjust duration and then select a start.
- We want a more intuitive “drag to select 9:00–12:00” interaction and visual parity with the Owner Availability Studio mental model.

## Goals

- Enable selecting a contiguous block (60-minute snap) on a single day.
- Convert selection to existing booking contract:
  - `startTime = rangeStart`
  - `durationMinutes = (rangeHours * 60)`
- Keep URL-driven state (`startTime`, `duration`) so links remain shareable.
- Keep time zone correctness (place time zone canonical).
- Use Motion for React (`motion`) for subtle selection-preview transitions with `useReducedMotion` support.

## Non-goals

- Multi-day repeat booking (Mon/Wed/Thu) in one checkout.
- Cart/checkout with multiple line items.
- 15/30-minute granularity.
- Any backend reservation schema changes.

## Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Owner studio UX reference | `agent-plans/75-owner-bookings-playground-dnd/75-00-overview.md` |
| Motion docs | https://motion.dev/docs/react/animate-presence , https://motion.dev/docs/react/use-reduced-motion |
| Availability month view | `src/shared/components/kudos/availability-month-view.tsx` |
| Slot picker | `src/shared/components/kudos/time-slot-picker.tsx` |
| Booking confirm | `src/app/(auth)/places/[placeId]/book/page.tsx` |
| Reservation create DTO | `src/modules/reservation/dtos/create-reservation.dto.ts` |

## Booking Contract (Current)

No API changes:

- Reservation create remains `{ startTime, durationMinutes }` (plus `courtId` or `{ placeId, sportId }`).
- Duration constraints: 60..1440 minutes, multiples of 60.

## UX Proposal (Studio-Like, Player)

Day timeline picker (single-day):

- Vertical hour grid (06:00–22:00 or derived from venue hours, still 60-min snap).
- Drag gesture:
  - Pointer down on an available cell = set anchor.
  - Drag to extend selection.
  - Pointer up commits and updates URL `startTime` + `duration`.
- Disallowed cells (booked/maintenance/walk-in) block selection.

Fallback:

- Click to set start; shift-click to set end.

Month view:

- Month grid stays for day selection.
- Right pane shows **only the selected day timeline** (not a long agenda list of multiple days).

## URL Contract

- Continue existing params:
  - `startTime` (ISO)
  - `duration` (minutes)
- For month/day navigation:
  - `view`, `month`, `date`

Note: we should not store arrays of slot ids in the URL.

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Shared contract + component design + selection algorithm | 1A | Yes |
| 2 | Implement timeline picker + integrate into public schedule surfaces | 2A | Partial |
| 3 | QA + polish | 3A | No |

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Range selection contract + picker spec | Dev 1 | `78-01-contract-and-selection.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Timeline picker + month/day integration | Dev 1 | `78-02-frontend-integration.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | QA + polish | Dev 1 | `78-03-qa.md` |

## Workstreams

### Shared / Contract

- [ ] Define range selection output: `{ startTime, durationMinutes }`.
- [ ] Define blocked-hour behavior when dragging across unavailable cells (prevent vs clamp).
- [ ] Define time grid bounds (fixed vs derived).

### Server / Backend

- [ ] N/A (reuse existing reservation + availability endpoints).

### Client / Frontend

- [ ] Build a new day timeline range picker component.
- [ ] Integrate it into the public month/day booking surfaces.
- [ ] Keep URL state as `startTime + duration`.
- [ ] Use Motion for selection-preview transitions.

## Success Criteria

- [ ] User can drag-select 9:00–12:00 on a day and proceed to booking with `duration=180`.
- [ ] Selection cannot include maintenance/booked hours.
- [ ] Selection is reflected in the URL (`startTime`, `duration`) and survives refresh.
- [ ] Reduced-motion users get minimal/no transform animations.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
