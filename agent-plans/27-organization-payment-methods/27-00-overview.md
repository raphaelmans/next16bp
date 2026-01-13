# Organization Payment Methods + Org Reservation Policy Defaults - Master Plan

## Overview

This plan introduces **organization-scoped payment methods** (mobile wallet + bank) with **per-method instructions** and a single **default method**, and moves reservation timing policy to an **organization-scoped policy table** with **defaults only (not editable yet)**.

It also removes the legacy place-scoped `reservable_place_policy` to avoid duplicated configuration and to prevent payment account details from being exposed via public endpoints.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/15-organization-payment-methods/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Legacy P2P Payment Story | `agent-plans/user-stories/08-p2p-reservation-confirmation/08-01-02-payment-page-display-payment-instructions.md` |
| Legacy Reservation Policies Story | `agent-plans/user-stories/12-reservation-policies/12-01-owner-configures-reservation-policies.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Database foundation + backfill strategy | 1A | Yes |
| 2 | Backend APIs + reservation-scoped payment info | 2A, 2B | Partial |
| 3 | Owner Settings UI (payment methods) | 3A | Yes |
| 4 | Player Payment UI + privacy hardening | 4A | Partial |
| 5 | Deprecation + removal of legacy table | 5A | No |

---

## Module Index

### Phase 1: Foundation

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Org policy + payment method tables | `27-01-data-model-and-migration.md` |

### Phase 2: Backend

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Org payment methods router/service | `27-02-backend-apis-and-security.md` |
| 2B | Reservation payment info endpoint | `27-02-backend-apis-and-security.md` |

### Phase 3: Owner UI

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Owner Settings: manage methods | `27-03-owner-settings-ui.md` |

### Phase 4: Player UI

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Payment page: show org methods | `27-04-player-payment-page-ui.md` |

### Phase 5: Cleanup

| ID | Module | Plan File |
|----|--------|-----------|
| 5A | Remove `reservable_place_policy` usage | `27-05-deprecation-removal.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2 ─────── Phase 3
             │           │
             │           └────────── Phase 4
             │
             └────────────────────── Phase 5
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment method scope | Organization-level | Avoid duplication across places/courts; consistent for owners |
| Instructions | Per payment method | Different rails/providers require different steps |
| Default method | Single default per org | Player sees recommended option first |
| Reservation policy scope | Organization-level | Defaults apply consistently across org; editable later |
| Privacy | Reservation-scoped access | Prevent public leakage of payment account details |

---

## Success Criteria

- [ ] Owners can CRUD payment methods and set a default.
- [ ] Players see active methods only within their reservation payment context.
- [ ] No public endpoint returns payment account numbers.
- [ ] Reservation TTL/cancellation logic reads org policy defaults.
- [ ] `pnpm lint` and `pnpm build` pass.

---

## Document Index

| Document | Description |
|----------|-------------|
| `agent-plans/27-organization-payment-methods/27-00-overview.md` | Master plan |
| `agent-plans/27-organization-payment-methods/27-01-data-model-and-migration.md` | DB schema + migration strategy |
| `agent-plans/27-organization-payment-methods/27-02-backend-apis-and-security.md` | Routers/services + security model |
| `agent-plans/27-organization-payment-methods/27-03-owner-settings-ui.md` | Owner UX + UI layout |
| `agent-plans/27-organization-payment-methods/27-04-player-payment-page-ui.md` | Player payment UX + UI layout |
| `agent-plans/27-organization-payment-methods/27-05-deprecation-removal.md` | Removing legacy table |
| `agent-plans/27-organization-payment-methods/organization-payment-methods-dev1-checklist.md` | Backend/DB checklist |
| `agent-plans/27-organization-payment-methods/organization-payment-methods-dev2-checklist.md` | Frontend checklist |
