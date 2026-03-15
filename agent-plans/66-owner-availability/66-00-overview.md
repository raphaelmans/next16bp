# Owner Availability + Shared Month Calendar - Master Plan

## Overview

Remove the legacy owner "Manage Slots" flow (slot materialization) and replace it with a schedule-derived Availability page. Extract the month-first availability calendar UI into a reusable component so the public schedule page can render the same month layout via a shared abstraction.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Cutover plan | `agent-plans/65-rules-exceptions-cutover/65-00-overview.md` |
| Public month view (existing) | `agent-plans/54-public-schedule-month-view/54-00-overview.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Remove Manage Slots + reroute links | 1A | Yes |
| 2 | Extract reusable month availability calendar | 2A | Partial |
| 3 | Add owner court Availability page | 3A | Partial |
| 4 | QA + cleanup | 4A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Remove Manage Slots + redirects | Dev 1 | `66-01-remove-manage-slots.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Shared month availability calendar component | Dev 1 | `66-02-shared-availability-month-view.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Owner court availability page | Dev 1 | `66-03-owner-availability-page.md` |

### Phase 4

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | Lint/build + dead code removal | Dev 1 | `66-03-owner-availability-page.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Owner UX replacement | Availability (schedule-derived) | Slots no longer exist; availability is computed from schedule + exceptions + reservations |
| Calendar default | Month | Matches owner need to sanity-check schedule coverage quickly |
| Shared component location | `src/shared/components/kudos/` | Already hosts booking widgets (date picker, slot picker) and is safe for public + owner |
| Back-compat | Keep `/slots` routes but redirect | Avoid broken deep links and stale bookmarks |

---

## Success Criteria

- [ ] Owner "Manage Slots" is removed from nav and no longer used anywhere.
- [ ] Old `/slots` URLs redirect to the new Availability page.
- [ ] New owner Availability page loads month availability for a single court.
- [ ] Public schedule page uses the shared month calendar component (no behavior regression).
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
