# Payment Flow UI Cleanup - Master Plan

## Overview

Move payment instructions into the dedicated payment route and remove duplicate payment info from the booking review screen. Align the payment card with policy-based payment details from the time slot.

### Completed Work (if any)

- Payment page uses `PaymentInfoCard` and proof form for `AWAITING_PAYMENT`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/06-court-reservation/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Move payment info UI | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Move payment info UI

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Payment info card refactor | UI Agent | `17-01-payment-page-info.md` |
| 1B | Booking page cleanup | UI Agent | `17-01-payment-page-info.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B | Booking/payment UI |

---

## Dependencies Graph

```
Phase 1
 ├─ 1A (PaymentInfoCard)
 └─ 1B (Booking cleanup)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment instructions UI | Use `PaymentInfoCard` on payment page | Centralize payment instructions in dedicated flow |
| Booking page | Remove payment info card | Avoid duplicate payment instructions |

---

## Document Index

| Document | Description |
|----------|-------------|
| `17-00-overview.md` | This file |
| `17-01-payment-page-info.md` | Phase 1 details |

---

## Success Criteria

- [ ] Booking review page no longer shows payment info
- [ ] Payment page shows payment info card with policy details
- [ ] UI uses existing payment proof flow
- [ ] `pnpm lint` and `pnpm build` pass
