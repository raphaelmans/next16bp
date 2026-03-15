# Phase 1: Owner Reminder UI

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-15-06

---

## Objective

Surface payment-method setup reminders in the owner journeys when no methods exist, and add stable section hashes on settings cards for deep linking.

---

## Modules

### Module 1A: Reminder Cards + Settings Anchors

**User Story:** `US-15-06`

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Payment methods missing                     │
│ Add a payment method to receive payments.   │
│ [Manage payment methods]                    │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Add shared constants for settings section hashes.
2. Attach `id` attributes to settings cards (profile, contact, payments, danger).
3. Render reminder card on `owner/places/new` when methods = 0.
4. Render reminder card on `owner/reservations` when methods = 0.
5. Use hash deep links in CTAs to `owner/settings#payment-methods`.

#### Testing Checklist

- [ ] Verify reminder visibility toggles with payment methods.
- [ ] Confirm hash navigation scrolls to payment methods card.
- [ ] Ensure reminders don’t block place creation or reservations UI.

#### Handoff Notes

- Align copy with design system (minimal, neutral, teal CTA).
- Keep reminders hidden for non-owners or loading states.
