# Phase 3C Addendum: Owner Reservation Status UX + Audit Timeline

**Dependencies:** Owner reservations list + detail pages exist  
**Parallelizable:** Partial (UI + query changes)  
**User Stories:** US-14-11 (owner filtering), US-14-12 (owner ops), auditability requirement

---

## Objective

Improve owner-facing reservation clarity and auditability:

- Replace coarse “Pending” labels with true workflow stages (Awaiting Payment, Payment Marked, etc.).
- Display full reservation event history for audit trails in owner views.
- Align owner list, alerts panel, and detail page with a consistent stage vocabulary.

---

## Scope

### In Scope

- Owner reservations list status column uses **workflow stage** (not aggregated pending).
- Owner alerts panel uses the same stage labels.
- Owner reservation detail page displays the full event timeline from `reservation_event`.
- Player reservation detail page uses the same event-driven timeline (replacing the partial hardcoded list).

### Out of Scope (Deferred)

- Editing or rewriting historical event records.
- Changing the reservation contract or event emission logic.

---

## Modules

### Module A: Stage Labels (Owner Lists + Alerts)

**Primary UI:**
- `src/features/owner/components/reservations-table.tsx`
- `src/features/owner/components/reservation-alerts-panel.tsx`

**Behavior:**
- Use `reservation.reservationStatus` for label + styling.
- Owner-facing label mapping:
  - `CREATED` → “Needs Acceptance”
  - `AWAITING_PAYMENT` → “Awaiting Payment”
  - `PAYMENT_MARKED_BY_USER` → “Payment Marked”
  - `CONFIRMED` → “Confirmed”
  - `EXPIRED` → “Expired”
  - `CANCELLED` → “Cancelled”

**Action gating:**
- `CREATED`: Accept / Reject
- `PAYMENT_MARKED_BY_USER`: Confirm / Reject
- `AWAITING_PAYMENT`: View-only or Cancel (confirm product decision)

---

### Module B: Owner Reservation Detail Timeline

**Primary UI:**
- `src/app/(owner)/owner/reservations/[id]/page.tsx`

**Data:**
- Use `audit.reservationHistory` to fetch events.
- Render timeline entries sorted by `createdAt`.
- Display:
  - Event label (from `toStatus`)
  - Timestamp
  - `triggeredByRole` and optional notes (auditability)

---

### Module C: Player Reservation Detail Timeline

**Primary UI:**
- `src/app/(auth)/reservations/[id]/page.tsx`

**Behavior:**
- Replace the current partial activity list with the full event timeline.
- Ensure the owner + player views share consistent labels.

---

## API Endpoints Used

| Endpoint | Type | Purpose |
|---------|------|---------|
| `audit.reservationHistory` | Query | Fetch all `reservation_event` rows for timeline |
| `reservationOwner.getForOrganization` | Query | Owner reservation list (already used) |

---

## UI Layout (Timeline)

```text
Activity
┌───────────────────────────────────────────┐
│ ● Reservation Created        1/13 1:04 AM │
│   Role: PLAYER                           │
│   Notes: Awaiting owner acceptance       │
│                                           │
│ ● Awaiting Payment         1/13 1:15 AM  │
│   Role: OWNER                            │
│   Notes: Owner accepted                   │
│                                           │
│ ● Payment Marked           1/13 1:18 AM  │
│   Role: PLAYER                           │
│                                           │
│ ● Confirmed                1/13 1:18 AM  │
│   Role: OWNER                            │
└───────────────────────────────────────────┘
```

---

## Validation Checklist

- [ ] Owner list shows “Awaiting Payment” instead of “Pending”.
- [ ] Owner alerts panel uses the same stage labels.
- [ ] Owner reservation detail shows full event history.
- [ ] Player reservation detail shows full event history.
- [ ] `pnpm lint` and `pnpm build` pass.
