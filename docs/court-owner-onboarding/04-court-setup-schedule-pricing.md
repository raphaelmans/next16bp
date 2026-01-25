# 4) Court Setup: Schedule + Pricing

## What the owner experiences

```text
/owner/venues/:placeId/courts/setup?courtId=:courtId&step=schedule
   |
   | “Schedule & Pricing” editor (per day)
   | - add time blocks
   | - mark open/closed
   | - set hourly rate + currency
   | - copy from another court
   v
server persists to:
  court_hours_window (open blocks)
  court_rate_rule    (priced blocks)
```

There is also a standalone schedule page:
- `/owner/venues/:placeId/courts/:courtId/schedule` renders the same editor.

## Routes (UI)

- Wizard: `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`
- Standalone schedule: `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/schedule/page.tsx`

Redirect-only legacy routes:
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/hours/page.tsx` -> schedule
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/pricing/page.tsx` -> schedule

## Key UI component

- `src/features/owner/components/court-schedule-editor.tsx`

The editor renders “blocks” per day, where each block has:
- start/end time
- open toggle
- currency + hourly rate

On save, blocks are split into two payloads:
- open blocks -> `court_hours_window` rows
- priced blocks -> `court_rate_rule` rows

Overnight input (end <= start) is represented by splitting into two rows across day boundaries.

## APIs (tRPC)

- Hours:
  - `courtHours.get`
  - `courtHours.set`
  - `courtHours.copyFromCourt`
- Pricing:
  - `courtRateRule.get`
  - `courtRateRule.set`
  - `courtRateRule.copyFromCourt`

Routers:
- `src/modules/court-hours/court-hours.router.ts`
- `src/modules/court-rate-rule/court-rate-rule.router.ts`

## Data model (DB)

- `court_hours_window` (dayOfWeek + startMinute/endMinute, non-overlapping)
- `court_rate_rule` (dayOfWeek + startMinute/endMinute + hourlyRateCents + currency, non-overlapping)
- (exception pricing) `court_price_override` (ad hoc overrides used by pricing computation)

## Validation / constraints (current)

Client-side:
- Prevent overlapping hour windows and overlapping pricing windows.
- Flag invalid time inputs (missing or unparsable time).

Server-side:
- Hours/rule overlap checks are enforced by services (errors map to tRPC `CONFLICT`).

## Important note: “Publish slots” is legacy

Some docs still describe a slot materialization flow (`time_slot` publishing). Current runtime behavior is schedule-derived availability (see `src/modules/availability/services/availability.service.ts` and `agent-plans/65-rules-exceptions-cutover/65-00-overview.md`).

The setup wizard still labels Step 3 as “Publish”, but in current UI it functions as a summary step and routes owners to Availability.
