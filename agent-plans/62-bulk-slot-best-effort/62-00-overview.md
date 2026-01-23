# Bulk Slot Best-Effort - Master Plan

## Overview

Implement best-effort bulk time slot creation with overlap protection and async post-response logging. This plan focuses on server-side bulk insert performance, Postgres safety constraints, and updated owner-facing messaging.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/05-availability-management/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | DB overlap protection | 1A | No |
| 2 | Backend bulk insert + after hook | 2A | No |
| 3 | Client hook + toast messaging | 3A | Yes |

---

## Module Index

### Phase 1: DB Overlap Protection

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | time_slot exclusion constraint | Dev 1 | `62-01-db-constraints.md` |

### Phase 2: Backend Best-Effort Insert

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Bulk insert + pricing prefetch | Dev 1 | `62-02-backend-bulk-insert.md` |

### Phase 3: Client Updates

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Slot hook + toast messaging | Dev 1 | `62-03-client-updates.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overlap enforcement | Postgres exclusion constraint | Prevents race-condition overlaps and simplifies app logic |
| Bulk insert strategy | `ON CONFLICT DO NOTHING` | Best-effort insert with clear skip counts |
| Async post-response work | `after()` logging hook | Avoids blocking the mutation response |

---

## Success Criteria

- [ ] Bulk creation skips conflicts instead of failing the whole request.
- [ ] Missing pricing rules skip only affected slots (no global failure).
- [ ] Owner UI shows created + skipped counts.
- [ ] `after()` used for non-blocking side effects.
- [ ] Migration adds overlap constraint without schema regressions.
