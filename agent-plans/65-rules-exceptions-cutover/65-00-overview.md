# Rules + Exceptions Cutover - Master Plan

## Overview

Remove `time_slot` materialization and the owner "Manage Slots" UI. Move to a schedule-driven availability model where:

- Availability is computed from `court_hours_window` + `court_rate_rule`.
- Reservations store their own `courtId + startTime + endTime` (range-based).
- One-off owner controls (blocks/price overrides) are separate exception tables.

This project is explicitly in development; schema changes can be applied by resetting the DB and using `drizzle-kit push`.

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| Booking window | `agent-plans/63-booking-window-60-days/63-00-overview.md` |
| Court schedule editor | `src/features/owner/components/court-schedule-editor.tsx` |
| Availability service | `src/modules/availability/services/availability.service.ts` |
| Reservation service | `src/modules/reservation/services/reservation.service.ts` |
| DB schema exports | `src/shared/infra/db/schema/index.ts` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Schema cutover | 1A, 1B | No |
| 2 | Backend cutover (availability + reservation) | 2A, 2B, 2C | Partial |
| 3 | Owner UI cleanup + routing | 3A, 3B | Yes |
| 4 | QA + build validation | 4A | No |

---

## Module Index

### Phase 1: Schema Cutover

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | Remove `time_slot` + `reservation_time_slot` from schema | Agent | `65-01-schema-cutover.md` |
| 1B | Add range-based `reservation` + new exception tables | Agent | `65-01-schema-cutover.md` |

### Phase 2: Backend Cutover

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 2A | Rewrite availability to compute from schedule + reservations | Agent | `65-02-backend-cutover.md` |
| 2B | Rewrite reservation creation/owner ops without time slots | Agent | `65-02-backend-cutover.md` |
| 2C | Remove timeSlot tRPC router/module | Agent | `65-02-backend-cutover.md` |

### Phase 3: Owner UI Cleanup

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 3A | Remove/redirect owner slots pages | Agent | `65-03-owner-ui-cleanup.md` |
| 3B | Update navigation (sidebar/dropdowns) to Schedule + Bookings | Agent | `65-03-owner-ui-cleanup.md` |

### Phase 4: QA

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 4A | Lint/build + smoke paths | Agent | `65-04-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Availability storage | No stored AVAILABLE slots | Prevents table ballooning as owners scale |
| Reservation identity | `courtId + startTime + endTime` | Eliminates dependency on slot ids and multi-slot join table |
| Owner slot UI | Remove "Manage Slots" | Availability is defined by schedule + reservations |

---

## Success Criteria

- [ ] No references to `time_slot` in runtime code paths.
- [ ] Availability endpoints return options based on schedule rules.
- [ ] Reservations can be created/accepted/confirmed without slot rows.
- [ ] Owner slots pages removed or redirected; navigation updated.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
