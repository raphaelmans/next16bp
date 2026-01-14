# Phase 2: Inbox Filters + Slot-Time Logic

**Dependencies:** Phase 1 complete  
**Parallelizable:** No

---

## Objective

Implement slot-time based filtering for upcoming/past, and add inbox sub-filters to separate "Needs Acceptance" vs "Payment Marked" vs "Awaiting Payment".

---

## Filtering Rules

- **Inbox:** reservation status in `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`.
- **Upcoming:** not cancelled/expired and slot end >= now.
- **Past:** `CONFIRMED` and slot end < now.
- **Cancelled:** `CANCELLED` or `EXPIRED`.

---

## UI Scope

- Add inbox filter chips for:
  - All pending
  - Needs acceptance (CREATED)
  - Awaiting payment
  - Payment marked
- Counts are computed client-side from the filtered reservation list.

---

## Validation Checklist

- [ ] Upcoming/Past/Cancelled filters use slot start/end times.
- [ ] Inbox sub-filters update the table without refetch.
- [ ] Counts update with search/date filters applied.
