# Owner Court Blocks (Maintenance + Walk-In) - Master Plan

## Overview

Add owner tooling to create one-off blocks on a court time range:
- Maintenance blocks (disable availability)
- Walk-in booking blocks (reserve availability without the reservation flow)

Walk-in blocks store a computed price snapshot for gross revenue analytics.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/05-availability-management/` (US-05-03, US-05-04) |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` (blocking + pricing concepts) |
| Cutover Context | `agent-contexts/01-05-rules-exceptions-cutover.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Schema + constraints | 1A | No |
| 2 | Backend APIs (owner-only) | 2A, 2B | Partial |
| 3 | Owner UI on Availability page | 3A | Yes (after Phase 2 contracts) |
| 4 | Gross revenue analytics endpoint (optional v1) | 4A | Yes |

---

## Module Index

### Phase 1

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | `court_block` schema upgrades | `67-01-schema-and-constraints.md` |

### Phase 2

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Backend: `courtBlock` service + router | `67-02-backend-court-block-module.md` |
| 2B | Backend: walk-in price snapshot compute | `67-02-backend-court-block-module.md` |

### Phase 3

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Owner UI: create/list/cancel blocks on availability page | `67-03-owner-availability-ui-blocks.md` |

### Phase 4

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Owner analytics: gross revenue (reservations + walk-ins) | `67-04-analytics-gross-revenue.md` |

---

## Dependencies Graph

```
Phase 1 ───────► Phase 2 ───────► Phase 3
                      └──────────► Phase 4
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Walk-in pricing | Computed only | Keeps pricing consistent and analytics stable |
| Duration | Multiple of 60 minutes | Matches player booking UX |
| Overlaps | Disallow overlaps | Simplifies ops; avoids forced cancellations |
| Block removal | Soft-cancel (keep history) | Supports analytics and auditing |

---

## Document Index

| Document | Description |
|----------|-------------|
| `67-00-overview.md` | This file |
| `67-01-schema-and-constraints.md` | DB changes (types, revenue fields, overlap rules) |
| `67-02-backend-court-block-module.md` | Owner-protected tRPC endpoints + overlap enforcement |
| `67-03-owner-availability-ui-blocks.md` | Owner UI on availability page |
| `67-04-analytics-gross-revenue.md` | Gross revenue calculation plan |
| `67-99-deferred.md` | Explicitly out of scope items |
| `owner-court-blocks-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] Owners can create maintenance blocks and see availability update immediately
- [ ] Owners can create walk-in blocks; price snapshot computed and stored
- [ ] Blocks cannot overlap active reservations or other active blocks
- [ ] Owners can cancel blocks without deleting history
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
