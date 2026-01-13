# Phase 3C Addendum: Owner Slot Publishing Prerequisites + Navigation Fixes

**Dependencies:** Phase 3 (Owner UI) baseline exists  
**Parallelizable:** Yes (client-first, minimal server follow-up)  
**User Stories:** US-14-07, US-14-08, US-14-09, US-14-12, US-14-13

---

## Objective

Make the v1.2 owner flow cohesive and error-resistant:

- Owners can reliably reach **Hours**, **Pricing Rules**, and **Slots** from the courts list.
- Slot publishing is gated by clear prerequisites (hours + pricing rules), preventing `SLOT_PRICING_UNAVAILABLE` and “silent” misconfiguration.
- Bulk slot publishing aligns with the **60-minute inventory** model.

---

## Scope

### In Scope

- Fix courts table actions dropdown so it does not trigger row navigation.
- Ensure “Manage Slots” routes correctly from place → courts list.
- Update bulk slot publish modal to:
  - Remove ad-hoc price input (derive from pricing rules)
  - Validate prerequisites and show CTAs
  - Offer only 60-minute slots

### Out of Scope (Deferred)

- Arbitrary per-slot price overrides during bulk publishing.
- Advanced slot-level override UX (can be implemented later as a dedicated page/flow).

---

## Modules

### Module A: Courts Table Navigation Reliability

**Primary UI:** courts list table for a place

**Goal:** Clicking the `...` actions button opens menu without redirect.

Implementation notes:
- Current pattern has row-level `onClick` navigation; ensure event propagation is blocked for actions.
- Prefer robust event handling that works with Radix `DropdownMenuTrigger` (`onPointerDown` and/or capture-phase stopPropagation).

Acceptance checks:
- Clicking row navigates to default management page.
- Clicking `...` does not navigate.
- Menu items navigate correctly:
  - Edit Hours → `/owner/places/:placeId/courts/:courtId/hours`
  - Pricing Rules → `/owner/places/:placeId/courts/:courtId/pricing`
  - Manage Slots → resolves to a working slots page

---

### Module B: Resolve Owner Slots Route From Place Context

**Problem:** `appRoutes.owner.places.courts.slots(placeId, courtId)` must resolve to a real page.

Options:
1. Create `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/slots/page.tsx` as a thin page that redirects/reuses existing owner slots UI.
2. Update links to use the existing court-level slots route (`/owner/courts/:courtId/slots`) consistently.

Choose the simplest option that avoids duplicate logic and supports deep-linking from place context.

---

### Module C: Slot Publishing Prerequisites UX (Modal)

**Primary UI:** bulk slot creation modal

Target behavior:
- No free-form "Pricing" section in bulk publish.
- Show prerequisites section:
  - Hours configured? (courtHours.get)
  - Pricing rules configured? (courtRateRule.get)
- If missing:
  - Show alert(s) and link to configuration pages.
  - Disable "Create Slots".
- If present:
  - Allow slot creation; backend derives price from rules.

60-minute alignment:
- Bulk publish should create 60-minute slots only.
- Remove duration options that create 30/90-minute slots.

---

## API Endpoints Involved

| Endpoint | Type | Notes |
|---------|------|------|
| `courtHours.get` | Query | Detect whether hours exist |
| `courtHours.set` | Mutation | Configure hours windows (supports overnight split) |
| `courtRateRule.get` | Query | Detect whether pricing rules exist |
| `courtRateRule.set` | Mutation | Configure pricing rules |
| `timeSlot.createBulk` | Mutation | Publish slots; fails if no matching pricing rule |

---

## UX Layout (Modal)

```text
Create Time Slots
Create one or more 60-minute slots for your court.

[Prerequisites]
- Court hours:    ✅ Configured   [Edit hours]
- Pricing rules:  ❌ Missing      [Set pricing rules]

[Schedule]
- Date range (single or recurring)
- Days of week (recurring)
- Start time
- End time

[Preview]
- slots/day, days, total slots

[Cancel]                       [Create Slots (disabled if missing prereqs)]
```

---

## Key Decisions

- Bulk slot publishing derives pricing from `court_rate_rule`.
- Free pricing is represented via pricing rules with hourly rate = 0.
- Per-slot overrides are deferred to a separate explicit workflow.

---

## Risks / Follow-ups

- Canonical “free” representation must be consistent across booking paths (`priceCents = 0` vs `null`). If we standardize on 0, update booking logic that currently treats only `null` as free.
- Time zone alignment: pricing rules and hours windows are configured in local time; slot timestamps are stored with timezone. Ensure matching logic uses the intended time basis.

---

## Validation Checklist

- [ ] Courts table actions menu opens without redirect.
- [ ] Hours/pricing pages are reachable from actions menu.
- [ ] Slot publishing modal blocks with clear CTAs when hours/pricing missing.
- [ ] Bulk slot publishing creates only 60-minute slots.
- [ ] No `SLOT_PRICING_UNAVAILABLE` for properly configured courts.
- [ ] `pnpm lint` and `pnpm build` pass.
