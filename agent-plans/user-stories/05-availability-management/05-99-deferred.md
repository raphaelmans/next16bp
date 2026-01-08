# 05-99: Deferred Items - Availability Management

## Overview

Items explicitly deferred from the 05-availability-management domain for MVP simplification.

---

## Deferred Features

| Feature | Reason | Priority | Future Story |
|---------|--------|----------|--------------|
| Update slot price after creation | MVP: set price at creation only | Low | - |
| Recurring slot templates | Future enhancement | Medium | - |
| Slot duplication/copy | Convenience feature | Low | - |
| Bulk delete slots | MVP: delete one at a time | Low | - |
| Slot history/audit log | Tracked in reservation events | Low | - |

---

## Update Slot Price

**Current behavior:** Price is set at slot creation time.

**Deferred behavior:** Allow owners to update price of AVAILABLE slots.

**Backend exists:** `timeSlot.updatePrice` endpoint is implemented but not wired to frontend.

**When to revisit:** If owners request ability to adjust pricing for existing slots.

---

## Recurring Slot Templates

**Current behavior:** Bulk creation requires manual configuration each time.

**Deferred behavior:** Save recurring patterns as templates (e.g., "Weekday mornings 6am-12pm, 1hr slots, P200").

**When to revisit:** After MVP, when owners manage multiple courts with similar schedules.

---

## Confirm/Reject from Slots Page

**Note:** The slots page UI has `useConfirmBooking` and `useRejectBooking` hooks, but these actions belong to the **07-owner-confirmation** domain.

These hooks should call reservation endpoints, not slot endpoints:
- `reservationOwner.confirmPayment`
- `reservationOwner.reject`

**Decision:** Keep UI placeholders, implement in US-07-02.

---

## References

- PRD Section 18 (Deferred features)
- `07-owner-confirmation` domain for booking actions
