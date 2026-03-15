# Developer Checklist (Dev1)

Focus Area: Adjacent slot range selection (public)

Modules: 1A, 2A, 3A

## Shared / Contract

- [ ] Confirm blocked-hour drag behavior: prevent vs clamp.
- [ ] Confirm day grid bounds (fixed vs derived).
- [ ] Confirm which public surfaces will adopt range selection in v1.

## Server / Backend

- [ ] N/A.

## Client / Frontend

### Module 1A

- [ ] Document selection state mapping to `startTime + duration`.
- [ ] Finalize component contract for `TimeRangePicker`.

### Module 2A

- [ ] Add `src/shared/components/kudos/time-range-picker.tsx`.
- [ ] Integrate into `src/shared/components/kudos/availability-month-view.tsx`.
- [ ] Update schedule surfaces to set URL `startTime` + `duration` from selected range.
- [ ] Ensure availability queries supply 60-minute slots for the timeline.
- [ ] Add Motion transitions with `useReducedMotion`.

### Module 3A

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
- [ ] Manual tests in `78-03-qa.md`.
