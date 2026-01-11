# Reservation Policies - Master Plan

## Overview

This plan implements **per-court reservation policies** stored on reservable court details. These policies control:
- Optional owner confirmation behavior
- Court-specific TTL windows (payment hold and owner review)
- Player cancellation across all states (with cutoff)

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/12-reservation-policies/` |
| Reservation State Machine | `docs/reservation-state-machine.md` |
| Owner Confirmation Plan | `agent-plans/07-owner-confirmation/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Database + Defaults | 1A | No |
| 2 | Backend Enforcement | 2A, 2B | Partial |
| 3 | Owner Court UI | 3A | Yes |
| 4 | Player UX Alignment | 4A | Partial |
| 5 | Docs Update | 5A | Yes |

---

## Module Index

### Phase 1: Database + Defaults

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Extend reservable court details | Add policy fields + backfill defaults | `12-01-db-migration.md` |

### Phase 2: Backend Enforcement

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | TTL policy enforcement | Court-specific TTL, expiresAt semantics | `12-02-backend-enforcement.md` |
| 2B | Cancellation enforcement | Cancel all states + cutoff rules | `12-02-backend-enforcement.md` |

### Phase 3: Owner Court UI

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Court policy settings UI | Inputs + save via courtManagement.updateDetail | `12-03-owner-ui.md` |

### Phase 4: Player UX Alignment

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Booking + reservation pages | Show rules + reflect policy decisions | `12-04-player-ui.md` |

### Phase 5: Docs Update

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 5A | Update reservation state machine docs | Align docs with implementation | `12-05-docs.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Policy storage | `reservable_court_detail` | Already per-court config for reservable courts |
| Cancellation scope | All states (with cutoff) | Matches product requirement |
| Owner confirmation toggle scope | TBD (paid-only vs free+paid) | Paid-only avoids new states; free+paid requires new status |
| TTL semantics | Two windows (payment + owner review) | Avoid premature expiry after payment is marked |

---

## Success Criteria

- [ ] Court owners can set reservation policies per court
- [ ] Reservation TTL is court-specific (no hardcoded 15 min)
- [ ] Player can cancel reservations across all states (with cutoff)
- [ ] Owner confirmation behaves per court configuration
- [ ] `docs/reservation-state-machine.md` is updated after implementation
- [ ] Build passes
