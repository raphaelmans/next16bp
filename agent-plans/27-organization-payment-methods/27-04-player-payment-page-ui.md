# Phase 4: Player Payment Page UI

**Dependencies:** Phase 2 complete  
**Parallelizable:** Partial (depends on reservation payment info endpoint)  
**User Stories:** US-15-03, US-15-04

---

## Objective

Display organization payment methods (wallet/bank) with per-method instructions on the payment page, without exposing details publicly.

---

## Design System Notes

- Emphasize trust and clarity (status + timer + steps).
- Use Teal sparingly for primary actions.
- Use warning/neutral for expiring payment windows.

---

## UI Layout

### Payment Information Card (payment methods)

```
┌───────────────────────────────────────────────────────────────┐
│ Payment Information                                           │
│                                                               │
│  [⏱] Complete payment within 15 minutes.                      │
│                                                               │
│  Recommended                                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ GCash                                                     │  │
│  │ Account Name: Juan Dela Cruz                              │  │
│  │ Account No:   09xx-xxx-xxxx   [Copy]                      │  │
│  │ Instructions: Include reservation ID in message.           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ BPI                                                      │  │
│  │ Account Name: Juan Dela Cruz Sports                      │  │
│  │ Account No:   1234-5678-9012  [Copy]                     │  │
│  │ Instructions: Use reservation ID as reference.            │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Fallback (no methods)

- Show a clear fallback: contact owner for payment details.
- Do not mention cash.

---

## Data Fetching + Privacy

- Fetch payment methods via `reservation.getPaymentInfo(reservationId)`.
- Only allow reservation owner to view payment methods.
- Ensure time slot public endpoints do not include payment details.

---

## UX Details

- Default method is shown first and labeled “Recommended”.
- Per-method instructions are shown under each method.
- Copy button copies account number; show success toast.

---

## Testing Checklist

- [ ] Reservation owner sees methods.
- [ ] Another user cannot fetch methods.
- [ ] Payment page renders without methods (fallback).
- [ ] Default method appears first.
