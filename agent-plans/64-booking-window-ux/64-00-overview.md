# Booking Window UX - Master Plan

## Overview

With the 60-day booking window enforced (see `agent-plans/63-booking-window-60-days/`), we want to smooth out remaining UX edge cases:

- Prevent confusing states when users deep-link to a schedule date beyond the window.
- Show a clear, user-friendly message when the server rejects an availability request due to the booking window.

This plan is frontend-focused. It should not change the booking window rules.

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| Booking window enforcement | `agent-plans/63-booking-window-60-days/63-00-overview.md` |
| Public schedule page | `src/app/(public)/courts/[id]/schedule/page.tsx` |
| Re-exported schedules | `src/app/(public)/places/[placeId]/schedule/page.tsx`, `src/app/(public)/venues/[placeId]/schedule/page.tsx` |
| Toast error helper | `src/shared/lib/toast-errors.ts` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Schedule deep-link clamping | 1A | No |
| 2 | Clear booking-window error messaging | 2A, 2B | Yes |
| 3 | QA + regression checks | 3A | No |

---

## Module Index

### Phase 1: Deep-Link Clamping

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | Clamp `dayKey`/`month`/`startTime` params within 60-day window | Agent | `64-01-schedule-deeplink-clamp.md` |

### Phase 2: Error Messaging

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 2A | Show schedule error callout when availability fetch rejected | Agent | `64-02-window-error-messaging.md` |
| 2B | Map `BOOKING_WINDOW_EXCEEDED` to a friendly message | Agent | `64-02-window-error-messaging.md` |

### Phase 3: QA

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 3A | Manual QA + build validation | Agent | `64-03-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Deep links | Clamp to the nearest valid day and clear invalid selection | Avoids confusing empty/error screens |
| Error UI | Inline callout + optional toast mapping | Makes window constraints self-explanatory |

---

## Success Criteria

- [ ] Visiting schedule with `date`/`dayKey` beyond the window auto-corrects to the max allowed day.
- [ ] Schedule pages show a clear message if availability queries are rejected due to booking window.
- [ ] Booking mutations show a friendly error message for `BOOKING_WINDOW_EXCEEDED`.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
