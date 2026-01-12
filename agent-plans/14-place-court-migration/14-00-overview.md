# 14 - Place & Court Units Migration - Master Plan

**Version:** 1.0  
**Created:** January 12, 2026  
**Status:** Ready for Implementation

---

## Overview

This plan implements the v1.2 model shift:

- **Place** = venue/location listing (multi-sport capable)
- **Court** = bookable court unit inside a place (**1 court = 1 sport**)
- **TimeSlot** = 60-minute inventory rows per court
- **Reservation** = booking request following the mutual-confirmation contract
- **Duration strategy:** booking duration is **multiples of 60 minutes** by reserving **N consecutive 60-minute slots** (strategy A)
- **Any available:** chooses the **lowest total price** among courts that can satisfy the requested duration

This plan intentionally assumes a **dev reset / clean cutover** (no legacy data migration). The system is rebuilt on the new schema and seeded with minimal reference data.

---

## User Stories Covered

| ID | Story | Workstream |
|----|-------|------------|
| US-14-01 | Player Discovers Places With Sport Filters | Client + Server + DB |
| US-14-02 | Player Views Place Detail And Chooses Court Unit | Client + Server + DB |
| US-14-03 | Player Chooses Duration In 60-Minute Increments | Client + Server |
| US-14-04 | Player Books A Specific Court (Mutual Confirmation) | Client + Server + DB |
| US-14-05 | Player Books “Any Available Court” At A Place | Client + Server |
| US-14-06 | Owner Creates A Place With Multiple Courts | Client + Server + DB |
| US-14-07 | Owner Configures Day-Specific Court Hours (Incl. Overnight) | Client + Server + DB |
| US-14-08 | Owner Configures Hourly Pricing Rules Per Court | Client + Server + DB |
| US-14-09 | Owner Publishes 60-Minute Slots With Prices | Client + Server + DB |
| US-14-10 | Platform Migrates Existing Court Listings Into Place/Court Model | Simplified (dev cutover) |
| US-14-11 | Owner Filters Slots/Reservations By Place And Court | Client + Server |

---

## Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/14-place-court-migration/` |
| PRD v1.2 | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD Spec v1.2 | `business-contexts/kudoscourts-erd-specification-v1.2.md` |
| Reservation Contract | `docs/reservation-state-machine.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | DB schema + seeds | 1A, 1B | Partial |
| 2 | Server APIs + core booking logic | 2A, 2B, 2C | Partial |
| 3 | Owner UI (place/court/hours/pricing/slots) | 3A, 3B, 3C | Yes |
| 4 | Player UI (discovery/place/booking) | 4A, 4B, 4C | Yes |
| 5 | Cutover QA + polish | 5A | Partial |

---

## Module Index

### Phase 1: DB Schema + Seeds

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | New core tables | Place/Court/Sport/Hours/RateRules/Slot updates | `14-01-db-schema.md` |
| 1B | Reservation multi-slot | Add `reservation_time_slot` join model | `14-01-db-schema.md` |

### Phase 2: Server APIs + Booking Logic

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Place + court APIs | Public + owner-facing CRUD/query | `14-02-server-api.md` |
| 2B | Availability APIs | Court availability + duration support | `14-02-server-api.md` |
| 2C | Reservation APIs | Create-for-court + create-any-available | `14-02-server-api.md` |

### Phase 3: Owner UI Revamp

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Place management UI | List/create/edit places | `14-03-owner-ui.md` |
| 3B | Court setup UI | Courts list + create/edit court | `14-03-owner-ui.md` |
| 3C | Court ops UI | Hours + pricing + slots pages | `14-03-owner-ui.md` |

### Phase 4: Player UI Revamp

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Discovery updates | Sport filter + place cards | `14-04-player-ui.md` |
| 4B | Place detail flow | Sport selection + court selector + any available | `14-04-player-ui.md` |
| 4C | Booking flow | Duration + start time + confirm | `14-04-player-ui.md` |

### Phase 5: QA + Polish

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 5A | End-to-end validation | lint/build + booking sanity passes | `14-05-cutover-qa.md` |

---

## Developer Assignments

| Developer | Focus | Modules |
|-----------|-------|---------|
| Server/DB Dev | Schema + APIs + booking logic | 1A, 1B, 2A, 2B, 2C |
| Client Dev | Owner + player flows (cohesive UX) | 3A, 3B, 3C, 4A, 4B, 4C |

---

## UI/UX Cohesion Requirements

Must follow `business-contexts/kudoscourts-design-system.md`.

Additionally (ui-ux-pro-max guidance):
- Multi-step flows must include progress indicators (e.g. “Step 2 of 4”).
- All forms must provide submit feedback (loading → success/error).
- Inputs must have labels (no placeholder-only).

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Booking duration | Strategy A (reserve N consecutive 60-min slots) | Enables dynamic duration without variable slot length inventory |
| Slot granularity | 60 minutes | Matches product requirement |
| Any available selection | Lowest total price | Clear and predictable |
| Default sport for seed/migration | Pickleball | Matches current product focus |
| Default place time zone | Asia/Manila | Matches current ops context |
| Data state | Dev clean cutover | Faster iteration than backwards-compatible migration |

---

## Dependencies Graph

```
Phase 1 (DB) ───► Phase 2 (APIs) ───► Phase 3 (Owner UI)
                    │                    │
                    └──────────────► Phase 4 (Player UI)
                                     │
                                     └──────────► Phase 5 (QA)
```

---

## Document Index

| Document | Description |
|----------|-------------|
| `14-00-overview.md` | This file |
| `14-01-db-schema.md` | Phase 1: DB schema + seeds |
| `14-02-server-api.md` | Phase 2: Server APIs + booking logic |
| `14-03-owner-ui.md` | Phase 3: Owner flow UI plan |
| `14-04-player-ui.md` | Phase 4: Player flow UI plan |
| `14-05-cutover-qa.md` | Phase 5: QA + validation |
| `place-court-migration-server-dev1-checklist.md` | Server/DB checklist |
| `place-court-migration-client-dev1-checklist.md` | Client checklist |

---

## Success Criteria

- [ ] Places can be discovered and filtered by sport
- [ ] Place detail shows courts and supports “Any available” booking
- [ ] Booking supports 60/120/180 minute durations by reserving consecutive slots
- [ ] Mutual-confirmation reservation contract is preserved
- [ ] Owner can manage places, courts, hours, pricing rules, and slots
- [ ] Owner can filter ops by place and court
- [ ] `pnpm lint` and `pnpm build` pass
