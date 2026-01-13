# Owner Reservable Court Setup State Machine (v1.2)

This document describes the owner journey from creating a **Place** to having a **fully configured reservable Court** that can publish **priced 60-minute slots**.

Scope: owner configuration only (Place → Court → Hours → Pricing Rules → Slot Publishing). Booking/reservation lifecycle is covered separately in `docs/reservation-state-machine.md`.

---

## Entities / Tables Involved

- **Place**: `place` (core listing + timezone + reservable/curated)
- **Place policy** (reservable): `reservable_place_policy` (owner confirmation + payment timing + instructions)
- **Court**: `court` (bookable unit; 1 sport per court)
- **Court hours**: `court_hours_window` (day-of-week + minute windows; overnight represented by splitting)
- **Court pricing**: `court_rate_rule` (day-of-week + minute windows + hourly_rate_cents; overnight represented by splitting)
- **Inventory**: `time_slot` (60-minute slots with status + price)

---

## State Diagram (High-Level)

```text
(START)
  |
  | owner creates place
  v
(PLACE_CREATED)
  |
  | set place type = RESERVABLE
  | set timezone (default Asia/Manila)
  v
(RESERVABLE_PLACE_ACTIVE)
  |
  | optional: configure reservable policies
  | (owner confirmation, payment windows, instructions)
  v
(PLACE_POLICY_CONFIGURED?)
  |
  | owner adds one or more courts (each court = one sport)
  v
(COURT_CREATED)
  |
  | court.is_active = true
  v
(COURT_ACTIVE)
  |
  | owner configures hours and pricing rules (order independent)
  v
(COURT_CONFIGURING)  <------------------------------------------+
  |                                                             |
  | {hours configured?} {pricing configured?}                    |
  | {hours cover publish range?} {pricing covers publish range?} |
  |                                                             |
  +--missing hours---------------------> (BLOCKED: NEED_HOURS)   |
  |                                                             |
  +--missing pricing-------------------> (BLOCKED: NEED_PRICING) |
  |                                                             |
  +--hours+pricing present------------> (PUBLISHABLE)            |
                                                                |
(PUBLISHABLE)                                                    |
  |                                                             |
  | owner publishes slots (bulk create)                          |
  | - creates 60-minute time_slot rows                           |
  | - slot price derived from pricing rules                      |
  v                                                             |
(SLOTS_PUBLISHED)                                                |
  |                                                             |
  | player discovery/booking can now consume inventory           |
  v                                                             |
(BOOKABLE) ------------------------------------------------------+

Notes:
- "BLOCKED" states are UX states (the UI should show alerts + links to fix).
- Pricing rules should be the default pricing source during publishing.
- "Free" pricing is represented by hourly_rate_cents = 0 in pricing rules.
```

---

## Court Configuration (Detailed, With Orthogonal Regions)

Hours and pricing are configured in separate editors and can be completed in any order. A court becomes "publishable" only when both are present and cover the intended publish range.

```text
+------------------------------------------------------------------------------------+
|                                 COURT_ACTIVE (composite)                           |
|                                                                                    |
|  Region A: Hours Windows (court_hours_window)                                      |
|                                                                                    |
|     (HOURS_MISSING)
|         |
|         | owner saves at least one window
|         v
|     (HOURS_PRESENT)
|         |
|         | owner selects a publish range
|         | {coverage check vs publish range}
|         +------------------------------+
|         |                              |
|         v                              v
|   (HOURS_COVER_RANGE)            (HOURS_GAPS_FOR_RANGE)
|         |                              |
|         +------------------------------+
|
|  Region B: Pricing Rules (court_rate_rule)                                          |
|                                                                                    |
|     (PRICING_MISSING)
|         |
|         | owner saves at least one rule
|         v
|     (PRICING_PRESENT)
|         |
|         | owner selects a publish range
|         | {coverage check vs publish range}
|         +------------------------------+
|         |                              |
|         v                              v
|   (PRICING_COVER_RANGE)          (PRICING_GAPS_FOR_RANGE)
|                                                                                    |
|  Gate: Can Publish Slots?                                                           |
|                                                                                    |
|     CAN_PUBLISH = HOURS_COVER_RANGE && PRICING_COVER_RANGE                           |
|                                                                                    |
+------------------------------------------------------------------------------------+

Practical UX interpretation:
- If HOURS_MISSING: show "Configure hours" CTA.
- If PRICING_MISSING: show "Configure pricing" CTA.
- If either has gaps: show "Adjust hours/pricing" guidance based on the selected range.
```

---

## Hours Editor (Court Hours Window) States

Hours are stored as non-overnight rows (startMinute < endMinute). Overnight input is represented by splitting across days.

```text
(HOURS_ROW_DRAFT)
  |
  | owner enters day + start + end
  | if end <= start: treat as overnight input
  v
(HOURS_ROW_NORMAL) OR (HOURS_ROW_OVERNIGHT)
  |
  | save
  v
(PERSISTED_WINDOWS)
  |
  | overnight becomes two persisted windows:
  |   day: start -> 24:00
  |   next day: 00:00 -> end
  v
(HOURS_PRESENT)
```

Common scenarios:
- Multiple windows/day (breaks): represent as multiple rows for the same day.
- Closed day: no rows for that day.

---

## Pricing Rules Editor States

Pricing rules are stored as hourly rate windows (startMinute < endMinute). Overlaps are prevented by the service.

```text
(RULES_EMPTY)
  |
  | owner adds rule
  v
(RULES_DRAFT)
  |
  | owner chooses day + start + end + currency + hourly rate
  | {validate: start < end}
  | {validate: no overlaps}
  v
(RULES_VALID)
  |
  | save
  v
(RULES_PERSISTED)

Free pricing:
- hourly_rate_cents = 0 for a window means slots in that window are free.

Overnight pricing:
- represent by splitting across days (same strategy as hours).
```

---

## Slot Publishing States (Owner Inventory)

Publishing creates 60-minute `time_slot` rows and derives `price_cents` + `currency` from pricing rules.

```text
(INVENTORY_EMPTY)
  |
  | owner opens "Create Time Slots" modal
  v
(PUBLISH_INTENT)
  |
  | {prereqs check}
  |   - hours present?
  |   - pricing rules present?
  v
(PUBLISH_BLOCKED) ---------------------+ 
  |                                    |
  | show alerts + links:               |
  | - Configure hours                  |
  | - Configure pricing                |
  |                                    |
  +------------owner fixes-------------+

(PUBLISH_READY)
  |
  | owner selects date/range + time range
  | system generates 60-min slots
  | system derives prices from pricing rules
  v
(SLOTS_CREATED)
  |
  | slots visible in owner slot list
  v
(INVENTORY_AVAILABLE)

Failure mode (backend):
- If pricing does not cover the slot start time: SLOT_PRICING_UNAVAILABLE
  UX goal: prevent reaching this by blocking publish when configuration is missing.
```

---

## UX Checkpoints (What The UI Should Make Obvious)

```text
Place page
  -> "Place type: Reservable" and "Time zone" visible
  -> optional: "Reservation policy" visible

Courts list under place
  -> for each court, show setup status chips:
     - Hours: Missing/Configured
     - Pricing: Missing/Configured
     - Slots: 0 / N published

Court detail / ops pages
  -> Hours editor: supports overnight input (auto-split)
  -> Pricing editor: supports free (hourly rate = 0) + prevents overlaps

Slots page
  -> Publish modal should NOT ask for arbitrary pricing
  -> Publish modal should show alerts + links if Hours/Pricing missing
```

---

## Time Basis (Timezone)

Hours and pricing rules are configured in local time, while slots are stored as timestamps with timezone.

For consistent UX:
- Use `place.time_zone` as the canonical local-time basis when displaying/editing hours, pricing rules, and intended publish ranges.
- If the server matches pricing rules using a different timezone basis, the UI may appear "correct" while publishing fails. Treat this as a cross-cutting consistency requirement.
