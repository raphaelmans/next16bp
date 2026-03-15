# Phase 1: Payment Page Info Card

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-06-02

---

## Objective

Ensure the payment flow shows payment details and instructions only on the dedicated payment page, while removing duplicate payment details from the booking review step.

---

## Modules

### Module 1A: Payment info card refactor

**User Story:** `US-06-02`  
**Reference:** `17-01-payment-page-info.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| N/A | N/A | N/A | N/A |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Complete Your Payment                       │
│ [Countdown timer]                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Payment Information                     │ │
│ │ Alert: complete payment before expiry   │ │
│ │ GCash + Bank details + instructions     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Payment Proof Form                      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Update `PaymentInfoCard` to accept payment details from the slot policy.
2. Render `PaymentInfoCard` on the payment page in place of `PaymentInstructions`.

#### Testing Checklist

- [ ] Payment page renders when `paymentDetails` exist
- [ ] Payment page renders fallback instructions when missing

---

### Module 1B: Booking page cleanup

**User Story:** `US-06-02`

#### Implementation Steps

1. Remove `PaymentInfoCard` from booking page review step.
2. Delete unused constants and imports.

---

## Phase Completion Checklist

- [ ] Payment info card moved to payment page
- [ ] Booking page no longer shows payment info
- [ ] Lint/build pass
