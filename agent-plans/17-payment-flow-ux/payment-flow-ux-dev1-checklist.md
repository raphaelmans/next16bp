# Developer 1 Checklist

**Focus Area:** Payment and booking UI cleanup  
**Modules:** 1A, 1B

---

## Module 1A: Payment info card refactor

**Reference:** `17-01-payment-page-info.md`  
**User Story:** `US-06-02`  
**Dependencies:** None

### Implementation

- [ ] Update `PaymentInfoCard` props for policy-based payment details
- [ ] Render card on payment page
- [ ] Remove `PaymentInstructions` if redundant

### Testing

- [ ] Manual check: payment page shows payment info

---

## Module 1B: Booking page cleanup

**Reference:** `17-01-payment-page-info.md`  
**User Story:** `US-06-02`

### Implementation

- [ ] Remove booking page payment info card
- [ ] Clean up unused constants/imports

---

## Final Checklist

- [ ] UI matches payment flow intent
- [ ] `pnpm lint` + `pnpm build` pass
