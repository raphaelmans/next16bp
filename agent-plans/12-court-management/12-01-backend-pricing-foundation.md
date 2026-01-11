# Phase 1: Pricing Foundation

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** US-02-06, US-06-03

---

## Objective

Add a default hourly price to reservable court details and ensure all reservation pricing logic falls back to that default when slot prices are null. This establishes a single source of truth for pricing across booking, payment, and reservation history.

---

## Modules

### Module 1A: Default Price Data Model + DTOs

**User Story:** `US-02-06`  
**Reference:** `12-00-overview.md`

#### Directory Structure

```
src/shared/infra/db/schema/court.ts
src/modules/court/dtos/
src/modules/court/use-cases/
src/modules/court/services/
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `courtManagement.createReservable` | Mutation | `{ defaultPriceCents?, defaultCurrency, isFree, ... }` | `CourtWithDetails` |
| `courtManagement.createCourt` | Mutation | `{ defaultPriceCents?, currency, ... }` | `CourtRecord` |
| `courtManagement.updateDetail` | Mutation | `{ courtId, defaultPriceCents?, defaultCurrency?, isFree?, payment... }` | `ReservableCourtDetailRecord` |

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Default Hourly Rate | number | No | min 0, integer cents |
| Currency | select | Yes | ISO-4217 |
| Is Free | boolean | Yes | toggles price |

#### Implementation Steps

1. Add `default_price_cents` column to `reservable_court_detail` schema.
2. Extend create/update DTOs to accept `defaultPriceCents`.
3. Store `defaultPriceCents` during court creation and detail update.
4. Ensure free courts set `defaultPriceCents` to null.

#### Testing Checklist

- [ ] Create reservable court with default price
- [ ] Update detail changes default price
- [ ] Free court clears default price

---

### Module 1B: Reservation Pricing Fallback

**User Story:** `US-06-03`  
**Reference:** `12-00-overview.md`

#### Directory Structure

```
src/modules/reservation/
src/modules/time-slot/repositories/
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `reservation.create` | Mutation | `{ timeSlotId }` | `ReservationRecord` |
| `reservation.getById` | Query | `{ reservationId }` | `ReservationRecord` |
| `timeSlot.getById` | Query | `{ slotId }` | `TimeSlotWithPaymentDetails` |

#### Implementation Steps

1. Update reservation service to treat slot price as paid when default price exists.
2. Extend time slot queries to expose default price and currency.
3. Compute reservation list `amountCents` and `currency` using default price fallback.

#### Testing Checklist

- [ ] Paid reservation created when slot price is null but default price exists
- [ ] Reservation list shows amount from default price
- [ ] Payment page receives default price fallback

---

## Phase Completion Checklist

- [ ] Default price stored on reservable court detail
- [ ] Reservation pricing fallback applied consistently
- [ ] No TypeScript errors
