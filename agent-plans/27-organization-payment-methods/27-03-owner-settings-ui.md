# Phase 3: Owner Settings UI (Payment Methods)

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** US-15-01, US-15-02

---

## Objective

Add a “Payment Methods” section to Owner → Organization Settings that allows owners to:
- add / edit / delete payment methods
- mark one method as default

Reservation policy is defaults-only for now (no UI editing).

---

## Design System Notes

Follow `business-contexts/kudoscourts-design-system.md`:
- Bento-style cards, generous whitespace.
- Teal for primary CTA, neutral for everything else.
- Clear hierarchy, mobile-first.

---

## UI Layout

### Settings Page Section

```
┌───────────────────────────────────────────────────────────────┐
│ Organization Settings                                         │
│ Manage your organization profile and preferences              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Organization Profile (existing)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Payment Methods                                          │  │
│  │ Add mobile wallets and bank accounts for bookings.       │  │
│  │                                                         │  │
│  │  [ + Add Payment Method ]                                │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ (Default badge)  GCash                            │  │  │
│  │  │ Account Name: Juan Dela Cruz                      │  │  │
│  │  │ Account No:   09xx-xxx-xxxx                        │  │  │
│  │  │ Instructions: Include reservation ID in message.   │  │  │
│  │  │ [Edit] [Set Default] [Deactivate] [Delete]         │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Add/Edit Payment Method Modal

Form fields (PH-only provider dropdown):
- Type: Mobile Wallet / Bank
- Provider: dropdown filtered by type
- Account Name: text (required)
- Account Number: text (required)
- Instructions: textarea (optional)
- Set as default: toggle

---

## UX Flow

```
Owner Settings
  └─ Add Payment Method
       ├─ Save → appears in list
       └─ Save as default → becomes highlighted + shown first
```

---

## Validation & Messaging

- Clear error messages for missing account name/number.
- Prevent duplicate methods (provider+account number).
- If deleting default method: prompt to select a new default (or auto-pick next active and show toast).

---

## Testing Checklist

- [ ] Create method with wallet provider.
- [ ] Create method with bank provider.
- [ ] Set default and confirm order/label.
- [ ] Delete default method and observe fallback behavior.
