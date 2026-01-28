# Phase 1: Contract + Selection Algorithm

Status: draft

## Objective

Specify and validate the contiguous-range selection model so it maps cleanly to the existing booking contract (`startTime + durationMinutes`).

## References

- Owner studio UX: `agent-plans/75-owner-bookings-playground-dnd/75-00-overview.md`
- Duration constraints: `src/shared/kernel/schemas.ts`, `src/shared/lib/duration.ts`
- Time zone rules: `src/shared/lib/time-zone.ts`

## Workstreams

### Shared / Contract

- [ ] Define selection state (URL-driven):
  - `startTime` (ISO)
  - `durationMinutes` (derived, stored as `duration` query param)

- [ ] Define selection algorithm:
  - Grid step: 60 minutes.
  - Anchor: pointer down cell start time.
  - Current: hovered/dragged-to cell.
  - Compute span:
    - `start = min(anchor, current)`
    - `endExclusive = max(anchor, current) + 60 minutes`
    - `durationMinutes = differenceInMinutes(endExclusive, start)`
  - Clamp:
    - `durationMinutes` must be within 60..1440.

- [ ] Define blocked-hour behavior:
  - Option A (recommended): prevent selecting across blocked cells; if the drag crosses a blocked cell, clamp the end to the last available contiguous cell.
  - Option B: disallow commit if any blocked cell exists within the span and show an inline error.

- [ ] Define bounds for the day timeline:
  - Option A: fixed bounds (eg 06:00–22:00) for consistent UX.
  - Option B: derive from availability slots returned by the API (min/max start times) and expand slightly.

### Server / Backend

- [ ] N/A.

### Client / Frontend

- [ ] Define the `TimeRangePicker` component contract:
  - Inputs:
    - `timeZone`
    - `dayKey`
    - `slots: TimeSlot[]` (60-minute granularity)
    - `selectedStartTime?: string`
    - `selectedDurationMinutes?: number`
  - Outputs:
    - `onChange({ startTime, durationMinutes })`
  - Accessibility:
    - Provide keyboard fallback (arrow keys to move focus, enter/space to set start/end).
    - Provide non-drag fallback for mobile.

## Acceptance Criteria

- Selection logic can represent any contiguous multi-hour booking in 60-minute increments.
- Result always maps to valid booking params (`startTime`, `durationMinutes`).
