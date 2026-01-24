# Booking Window (60 Days) - Master Plan

## Overview

Enforce a consistent 60-day max booking window across the system to prevent unbounded availability queries, far-future booking attempts, and owner slot creation that causes `time_slot` growth. This is a guardrail for scalability and predictable query cost.

This plan does not implement retention/pruning of historical `time_slot` rows (explicitly deferred).

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/03-court-reservation/` |
| User Stories | `agent-plans/user-stories/14-place-court-migration/` |
| Public booking UI | `src/app/(public)/places/[placeId]/page.tsx` |
| Public schedule UI | `src/app/(public)/courts/[id]/schedule/page.tsx` |
| Booking review page | `src/app/(auth)/places/[placeId]/book/page.tsx` |
| Availability DTOs | `src/modules/availability/dtos/availability.dto.ts` |
| Time slot DTOs | `src/modules/time-slot/dtos/get-available-slots.dto.ts` |
| Time slot DTOs | `src/modules/time-slot/dtos/get-slots-for-court.dto.ts` |
| Reservation DTOs | `src/modules/reservation/dtos/create-reservation.dto.ts` |
| Reservation service | `src/modules/reservation/services/reservation.service.ts` |
| Shared date picker | `src/shared/components/kudos/date-picker.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Server enforcement (schemas + guards + error) | 1A, 1B, 1C, 1D | Yes |
| 2 | Client enforcement (date pickers + calendars) | 2A, 2B, 2C | Yes |
| 3 | QA + consistency checks | 3A | No |
| 99 | Deferred retention/pruning | 99A | - |

---

## Module Index

### Phase 1: Server Enforcement

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | Shared `MAX_BOOKING_WINDOW_DAYS = 60` constant | Agent | `63-01-server-enforcement.md` |
| 1B | Availability DTO caps (45 -> 60 + lead-time cap) | Agent | `63-01-server-enforcement.md` |
| 1C | Time slot DTO caps (`getAvailable`, `getForCourt`) | Agent | `63-01-server-enforcement.md` |
| 1D | Reservation booking lead time + domain error | Agent | `63-01-server-enforcement.md` |

### Phase 2: Client Enforcement

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 2A | Pass `maxDate` into `KudosDatePicker` (public booking flows) | Agent | `63-02-client-enforcement.md` |
| 2B | Cap month navigation + selection in public schedule calendar | Agent | `63-02-client-enforcement.md` |
| 2C | Cap owner bulk slot date selection | Agent | `63-02-client-enforcement.md` |

### Phase 3: QA

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 3A | Manual QA + build validation | Agent | `63-03-qa.md` |

---

## Dependencies Graph

```
Phase 1 ──────┬───── Phase 2 ────── Phase 3
              │
         1A ──┼── 1B/1C/1D
              │
         2A ──┴── 2B/2C
```

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Booking window | 60 days | Bounded query/payload cost while still “open schedule” UX |
| Enforcement | Server + client | Client prevents invalid picks; server prevents bypass |
| Owner slot creation | Also capped at 60 days | Prevents `time_slot` ballooning even if schedule is open-ended |

---

## Document Index

| Document | Description |
| --- | --- |
| `63-00-overview.md` | This file |
| `63-01-server-enforcement.md` | Server DTO + guard plan |
| `63-02-client-enforcement.md` | Date picker/calendar plan |
| `63-03-qa.md` | QA checklist |
| `63-99-deferred.md` | Deferred retention/pruning |
| `booking-window-60-days-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] Public availability endpoints reject date windows beyond 60 days ahead.
- [ ] Reservation creation rejects `startTime` beyond 60 days ahead (even if deep-linked).
- [ ] Owner slot creation rejects dates beyond 60 days ahead.
- [ ] Public booking UIs disable dates beyond 60 days ahead.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
