# Phase 3: Player Pricing Display

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-06-03

---

## Objective

Ensure players always see accurate pricing during discovery, booking, and payment flows by applying slot-level prices first and falling back to court default prices when needed.

---

## Modules

### Module 3A: Booking + Payment Price Visibility

**User Story:** `US-06-03`  
**Reference:** `12-00-overview.md`

#### Directory Structure

```
src/features/discovery/hooks/use-court-detail.ts
src/app/(public)/courts/[id]/page.tsx
src/features/discovery/components/booking-card.tsx
src/app/(auth)/reservations/[id]/payment/page.tsx
```

#### UI Layout

```
┌─────────────────────────────────────────────┐
│  ₱500.00 / hour                              │
│  Select Date                                │
│  [Slot] ₱500.00                              │
│  [Slot] ₱700.00                              │
│                                             │
│  Slot price      ₱500.00                     │
│  Total           ₱500.00                     │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Map court detail `defaultPriceCents` + `defaultCurrency` in discovery hook.
2. Apply default price fallback to available slots before rendering.
3. Update booking summary and payment page to use effective price.
4. Display "Free" when both slot and default prices are missing.

#### Testing Checklist

- [ ] Slot pricing shows default when custom price is null
- [ ] Custom price overrides default
- [ ] Payment page amount matches effective price
- [ ] Free courts display correctly

---

## Phase Completion Checklist

- [ ] Booking UI always shows effective price
- [ ] Payment page uses default price fallback
- [ ] No TypeScript errors
