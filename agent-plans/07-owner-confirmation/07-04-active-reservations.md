# Phase 4: Active Reservations Ops

**Dependencies:** Phases 1-3 complete  
**Parallelizable:** Partial  
**User Stories:** US-07-03, US-07-04

---

## Objective

Ensure slot lists reflect the reservation state machine accurately and add a dedicated active reservations page with TTL countdowns, quick actions, and deep links.

---

## Modules

### Module 4A: Slot Status Mapping + Quick Actions

**User Story:** `US-07-03`  
**Reference:** `07-00-overview.md`

#### Directory Structure

```
src/modules/time-slot/
src/modules/reservation/
src/features/owner/hooks/use-slots.ts
src/features/owner/components/slot-item.tsx
src/features/owner/components/slot-list.tsx
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `timeSlot.getForCourt` | Query | `{ courtId, startDate, endDate }` | `TimeSlot[]` with reservation status + id |
| `reservationOwner.confirmPayment` | Mutation | `{ reservationId, notes? }` | `ReservationRecord` |
| `reservationOwner.reject` | Mutation | `{ reservationId, reason }` | `ReservationRecord` |
| `reservationOwner.cancel` | Mutation | `{ reservationId, reason }` | `ReservationRecord` |

#### Data Contract

Add to slot payload for `HELD` slots:

```
reservationId: string | null
reservationStatus: "AWAITING_PAYMENT" | "PAYMENT_MARKED_BY_USER" | null
reservationExpiresAt: string | null
```

#### UI Layout

```
┌─────────────────────────────────────────────┐
│  6:00 AM - 7:00 AM      [Awaiting payment]  │
│  Raphael • 0917...      [View] [Cancel]     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  7:00 AM - 8:00 AM      [Payment marked]    │
│  Raphael • 0917...      [Confirm] [Reject]  │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Extend `timeSlot.getForCourt` response to include reservation status and id.
2. Update `useSlots` mapping to derive labels from reservation status (not slot status alone).
3. Wire slot actions to reservationOwner mutations (confirm, reject, cancel/expire).
4. Refresh slot list + pending counts after actions.

#### Testing Checklist

- [ ] HELD + AWAITING_PAYMENT shows "Awaiting payment" badge
- [ ] HELD + PAYMENT_MARKED_BY_USER shows "Payment marked"
- [ ] Confirm/reject/cancel actions update slot list state

---

### Module 4B: Active Reservations Page (TTL)

**User Story:** `US-07-04`  
**Reference:** `07-00-overview.md`

#### Directory Structure

```
src/app/(owner)/owner/reservations/active/page.tsx
src/features/owner/components/active-reservations-list.tsx
src/features/owner/hooks/use-owner-reservations.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `reservationOwner.getForOrganization` | Query | `{ organizationId, status?, limit, offset }` | `ReservationWithDetails[]` |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Active Reservations (TTL)                   │
│ [Filter: Awaiting Payment]                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Raphael • Court A • 6:00 AM              │ │
│ │ Awaiting payment  09:45 left             │ │
│ │ [View] [Cancel]                          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Raphael • Court A • 7:00 AM              │ │
│ │ Payment marked                           │ │
│ │ [Confirm] [Reject]                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Create `/owner/reservations/active` page with active status filters.
2. Include TTL countdown using `expiresAt` on `AWAITING_PAYMENT` reservations.
3. Add quick actions (confirm/reject/cancel) based on status.
4. Deep link to `/owner/reservations/[id]` from each row.

#### Testing Checklist

- [ ] TTL countdown renders and updates on refresh
- [ ] Status filters update the list correctly
- [ ] Actions route to correct mutations

---

## Phase Completion Checklist

- [ ] Slot list labels align with reservation status
- [ ] Active reservations page accessible at `/owner/reservations/active`
- [ ] TTL countdowns and quick actions functional
- [ ] No TypeScript errors
