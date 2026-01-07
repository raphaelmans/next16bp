# KudosCourts Server-Side Development - Master Plan

## Overview

This document provides the master plan for implementing the KudosCourts MVP backend. The system is a player-first, location-based pickleball court discovery and reservation platform.

### Completed Work

- **Database Schema**: All 14 tables have been created using Drizzle ORM
  - `profile`, `organization`, `organization_profile`
  - `court`, `curated_court_detail`, `reservable_court_detail`
  - `court_photo`, `court_amenity`
  - `time_slot`, `reservation`, `payment_proof`, `reservation_event`
  - `claim_request`, `claim_request_event`
  - All enums defined in `enums.ts`

### Reference Documents

| Document | Location |
|----------|----------|
| ERD Specification | `business-contexts/kudoscourts-erd-specification.md` |
| Database Schema | `src/shared/infra/db/schema/` |
| Architecture Guide | `guides/server/trpc/` |
| Reference Module (Auth) | `src/modules/auth/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| Pre-Phase | Infrastructure setup | 0A, 0B | Yes (2 modules) |
| Phase 1 | Foundation modules | 1A, 1B, 1C | Yes (3 modules) |
| Phase 2 | Court management | 2A, 2B | Sequential |
| Phase 3 | Reservation system | 3A, 3B, 3C | Partially (3B, 3C parallel after 3A) |
| Phase 4 | Claim requests | 4A, 4B | Sequential (parallel to Phase 3) |
| Phase 5 | Admin & utilities | 5A, 5B | Yes (2 modules) |

---

## Module Index

### Pre-Phase: Infrastructure

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 0A | Rate Limiting Infrastructure | Agent 0 | `01-server-infrastructure.md` |
| 0B | Admin Role System | Agent 0 | `01-server-infrastructure.md` |

### Phase 1: Foundation (All Parallel)

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Profile Module | Agent 1 | `02-server-foundation.md` |
| 1B | Organization Module | Agent 2 | `02-server-foundation.md` |
| 1C | Court Discovery Module | Agent 3 | `02-server-foundation.md` |

### Phase 2: Court Management

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Court Management Module | Agent 1 | `03-server-court-management.md` |
| 2B | Time Slot Module | Agent 2 | `03-server-court-management.md` |

### Phase 3: Reservation System

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Reservation Core | Agent 1 | `04-server-reservations.md` |
| 3B | Reservation Owner | Agent 2 | `04-server-reservations.md` |
| 3C | Payment Proof | Agent 3 | `04-server-reservations.md` |

### Phase 4: Claim Requests (Parallel Track)

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | Claim Request Module | Agent 4 | `05-server-claims.md` |
| 4B | Claim Admin Module | Agent 4 | `05-server-claims.md` |

### Phase 5: Admin & Utilities

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 5A | Admin Court Module | Any | `06-server-admin.md` |
| 5B | Audit Log Module | Any | `06-server-admin.md` |

---

## Agent Assignments

| Agent | Modules | Focus Area |
|-------|---------|------------|
| **Agent 0** | 0A, 0B | Infrastructure (rate limiting, admin roles) |
| **Agent 1** | 1A → 2A → 3A | Player journey: Profile → Court → Reservation |
| **Agent 2** | 1B → 2B → 3B | Owner journey: Organization → Slots → Confirmations |
| **Agent 3** | 1C → 3C → 5B | Discovery & utilities: Search → Proof → Audit |
| **Agent 4** | 4A → 4B → 5A | Claims & admin: Claim flow → Admin tools |

---

## Dependencies Graph

```
                    ┌─────────────────┐
                    │ 0A. Rate Limit  │
                    │ 0B. Admin Role  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌──────────┐       ┌──────────────┐     ┌───────────┐
   │1A.Profile│       │1B.Organization│    │1C.Court   │
   │          │       │              │     │ Discovery │
   └────┬─────┘       └──────┬───────┘     └─────┬─────┘
        │                    │                   │
        │                    └─────────┬─────────┘
        │                              ▼
        │                    ┌──────────────────┐
        │                    │2A.Court Mgmt    │
        │                    └────────┬─────────┘
        │                             ▼
        │                    ┌──────────────────┐
        │                    │2B.Time Slot     │
        │                    └────────┬─────────┘
        │                             │
        └──────────────┬──────────────┘
                       ▼
              ┌──────────────────┐
              │3A.Reservation    │
              │    Core          │
              └────────┬─────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼                           ▼
   ┌──────────────┐           ┌──────────────┐
   │3B.Reservation│           │3C.Payment    │
   │    Owner     │           │    Proof     │
   └──────────────┘           └──────────────┘


   ┌──────────────────────────────────────────┐
   │         PARALLEL TRACK (Phase 4)         │
   └──────────────────────────────────────────┘
         
   1B + 1C ─────────┐
                    ▼
            ┌──────────────────┐
            │4A.Claim Request  │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │4B.Claim Admin    │◄── Needs 0B (Admin Role)
            └──────────────────┘
```

---

## Estimated Timeline

| Phase | Modules | Estimated Time |
|-------|---------|----------------|
| Pre-Phase | 0A, 0B | 1-2 days |
| Phase 1 | 1A, 1B, 1C | 2-3 days (parallel) |
| Phase 2 | 2A, 2B | 2-3 days |
| Phase 3 | 3A, 3B, 3C | 3-4 days |
| Phase 4 | 4A, 4B | 2-3 days (parallel to Phase 3) |
| Phase 5 | 5A, 5B | 1 day |

**Total:** ~8-12 days with 4 agents working in parallel

---

## Architecture Patterns

All modules should follow the established patterns from the auth module:

```
src/modules/{module-name}/
├── {module}.router.ts        # tRPC router (API layer)
├── dtos/                     # Zod input schemas
│   ├── index.ts
│   └── {action}.dto.ts
├── errors/                   # Domain-specific errors
│   └── {module}.errors.ts
├── factories/                # Dependency injection
│   └── {module}.factory.ts
├── repositories/             # Data access layer
│   └── {module}.repository.ts
├── services/                 # Business logic
│   └── {module}.service.ts
└── use-cases/               # Complex multi-service operations
    └── {action}.use-case.ts
```

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rate Limiting | Upstash Ratelimit | Serverless-friendly, Redis-based |
| Rate Limit Response | 429 only | Simpler MVP, add headers later |
| Organization Slug | Auto-generate from name | User can edit manually |
| Admin Role | Extend existing user_roles | Minimal schema changes |

---

---

## UI Development

The UI development plans are located in `agent-plans/00-ui/`. See `00-ui/00-ui-overview.md` for the master UI plan.

### UI Phases

| Phase | Description | Plan File | Backend Dependency |
|-------|-------------|-----------|-------------------|
| UI-0 | Foundation & Design Tokens | `00-ui/01-ui-foundation.md` | None |
| UI-1 | Court Discovery | `00-ui/02-ui-discovery.md` | Phase 1C |
| UI-2 | Reservation Flow | `00-ui/03-ui-reservation.md` | Phase 3 |
| UI-3 | Owner Dashboard | `00-ui/04-ui-owner.md` | Phase 2 + 3B |
| UI-4 | Admin Dashboard | `00-ui/05-ui-admin.md` | Phase 4B + 5A |
| Shared | Component Library | `00-ui/06-ui-components.md` | None |

### Developer Assignments

| Developer | Backend Modules | UI Modules | Server Checklist | UI Checklist |
|-----------|-----------------|------------|------------------|--------------|
| **Dev 1** | 0A, 1A, 2A, 3A | UI-0A, UI-1A-D | `00-server/server-dev1-checklist.md` | `00-ui/ui-dev1-checklist.md` |
| **Dev 2** | 0B, 1B, 2B, 3B | UI-0B, UI-1E-G, UI-2A-B | `00-server/server-dev2-checklist.md` | `00-ui/ui-dev2-checklist.md` |
| **Dev 3** | 1C, 3C, 5B | UI-2C-F | `00-server/server-dev3-checklist.md` | `00-ui/ui-dev3-checklist.md` |
| **Dev 4** | 4A, 4B, 5A | UI-3A-F, UI-4A-C | `00-server/server-dev4-checklist.md` | `00-ui/ui-dev4-checklist.md` |

### Design System

See `business-contexts/kudoscourts-design-system.md` for:
- Color palette (Teal primary, Orange accent)
- Typography (Outfit, Source Sans 3, IBM Plex Mono)
- Spacing and radius tokens
- Component styling guidelines

---

## Complete File Index

### Server Planning (`00-server/`)
| File | Description |
|------|-------------|
| `00-server-overview.md` | This file - master plan |
| `01-server-infrastructure.md` | Rate limiting, admin roles |
| `02-server-foundation.md` | Profile, Organization, Court Discovery |
| `03-server-court-management.md` | Court Management, Time Slots |
| `04-server-reservations.md` | Reservation Core, Owner, Payment Proof |
| `05-server-claims.md` | Claim Request, Claim Admin |
| `06-server-admin.md` | Admin Court, Audit Log |
| `07-server-deferred.md` | Future enhancements |
| `server-dev1-checklist.md` | Infrastructure + Player Flow |
| `server-dev2-checklist.md` | Admin + Owner Flow |
| `server-dev3-checklist.md` | Court Discovery + Payment Proof |
| `server-dev4-checklist.md` | Claims + Admin |

### UI Planning (`00-ui/`)
| File | Description |
|------|-------------|
| `00-ui-overview.md` | UI master plan |
| `01-ui-foundation.md` | Tailwind, fonts, CSS variables |
| `02-ui-discovery.md` | Home, search, court detail |
| `03-ui-reservation.md` | Booking, payment, reservations |
| `04-ui-owner.md` | Owner dashboard |
| `05-ui-admin.md` | Admin dashboard |
| `06-ui-components.md` | Shared Kudos components |
| `ui-parallelization-guide.md` | Developer coordination |
| `ui-dev1-checklist.md` | Standalone UI checklist (Discovery) |
| `ui-dev2-checklist.md` | Standalone UI checklist (Layout + Booking) |
| `ui-dev3-checklist.md` | Standalone UI checklist (Reservations + Profile) |
| `ui-dev4-checklist.md` | Standalone UI checklist (Owner + Admin) |

---

## Estimated Timeline

### With 4 Parallel Developers

| Phase | Backend | UI | Combined Time |
|-------|---------|-----|---------------|
| Days 1-2 | Infrastructure (0A, 0B) | Foundation (UI-0) | 2 days |
| Days 2-4 | Phase 1 (1A, 1B, 1C) | Core Components (UI-1A-B) | 3 days |
| Days 4-6 | Phase 2 (2A, 2B) | Discovery + Court Detail (UI-1C-G) | 3 days |
| Days 6-9 | Phase 3 (3A, 3B, 3C) | Booking Flow (UI-2) | 3 days |
| Days 6-9 | Phase 4 (4A, 4B) | Owner Dashboard (UI-3) | 3 days |
| Days 9-10 | Phase 5 (5A, 5B) | Admin Dashboard (UI-4) | 2 days |
| Days 10-12 | Integration Testing | Polish & Testing | 2 days |

**Total: 10-12 days with 4 developers working in parallel**

---

## Next Steps

1. Review all plan files in this directory
2. Set up Upstash Redis (when ready)
3. Assign agents to their respective modules
4. Begin with Pre-Phase (0A, 0B) and UI-0 Foundation in parallel
5. Proceed to Phase 1 once infrastructure is ready
6. Follow the parallelization guide in `00-ui/ui-parallelization-guide.md`

---

## Planning Status: COMPLETE

All planning documents have been created:
- 8 backend planning documents
- 8 UI planning documents  
- 4 combined backend+UI developer checklists
- 4 standalone UI developer checklists
- 1 parallelization guide

**Ready for implementation.**
