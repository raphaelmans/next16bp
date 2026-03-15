# Court Management Wizard & Pricing - Master Plan

## Overview

This plan delivers a multi-step owner court setup wizard, a full edit flow for court details and pricing, and reliable pricing visibility for players during booking and payment. It introduces a default price at the court detail level, uses slot-level overrides when set, and ensures booking UI always shows effective pricing.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/02-court-creation/` |
| User Stories | `agent-plans/user-stories/06-court-reservation/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Pricing foundation (data + API) | 1A, 1B | Partial |
| 2 | Owner wizard + edit flow | 2A, 2B | Yes |
| 3 | Player pricing display updates | 3A | Yes |

---

## Module Index

### Phase 1: Pricing Foundation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Default price data model + DTOs | Dev 1 | `12-01-backend-pricing-foundation.md` |
| 1B | Reservation pricing fallback | Dev 1 | `12-01-backend-pricing-foundation.md` |

### Phase 2: Owner Wizard + Edit Flow

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Court setup wizard (nuqs steps) | Dev 2 | `12-02-owner-wizard-edit.md` |
| 2B | Court edit page + update flow | Dev 2 | `12-02-owner-wizard-edit.md` |

### Phase 3: Player Pricing Display

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Booking + payment price display | Dev 2 | `12-03-player-pricing-display.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B | Backend data + pricing fallback |
| Dev 2 | 2A, 2B, 3A | Owner UI + booking UI |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2 ─────── Phase 3
             │
        1A ──┼── 2A
             │
        1B ──┴── 2B ──────────────── 3A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Default price storage | `reservable_court_detail.default_price_cents` | Aligns with slot pricing and formatCurrency helpers |
| Slot pricing fallback | Use default price when slot price is null | Preserves "use default price" semantics |
| Wizard state | `step` query param via nuqs | Enables deep links and browser navigation |

---

## Document Index

| Document | Description |
|----------|-------------|
| `12-00-overview.md` | Master plan and phase layout |
| `12-01-backend-pricing-foundation.md` | Data model + pricing fallback |
| `12-02-owner-wizard-edit.md` | Owner wizard + edit flow |
| `12-03-player-pricing-display.md` | Player price visibility updates |
| `court-management-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Owner court setup uses multi-step wizard with nuqs step state
- [ ] Owners can edit pricing and payment details
- [ ] Default price is stored and used for slot pricing fallback
- [ ] Booking and payment flows show accurate pricing
- [ ] Owner price updates reflect in future default-priced slots
