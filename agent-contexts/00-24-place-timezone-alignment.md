# [00-24] Place Timezone Alignment

> Date: 2026-01-13
> Previous: 00-23-slot-hours-derivation.md

## Summary

Aligned booking, availability, pricing, and owner slot tooling to use place-local time zones across server and client to avoid UTC runtime mismatches.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/time-zone.ts` | Added shared TZ helpers for day bounds and weekday/minute calculations. |
| `src/shared/lib/format.ts` | Added place-timezone formatting helpers. |
| `src/modules/availability/services/availability.service.ts` | Used place TZ day boundaries for availability queries. |
| `src/modules/time-slot/services/time-slot.service.ts` | Computed pricing rule day/minute in place TZ. |
| `src/modules/reservation/services/reservation.service.ts` | Aligned slot-day lookup to place TZ. |
| `src/features/discovery/hooks/use-place-detail.ts` | Built availability queries using place TZ day start. |
| `src/features/discovery/hooks/use-court-detail.ts` | Derived slot range from place TZ. |
| `src/shared/components/kudos/date-picker.tsx` | Added timeZone support and TZ-aware min date. |
| `src/shared/components/kudos/time-slot-picker.tsx` | Rendered slot times in place TZ. |
| `src/app/(public)/places/[placeId]/page.tsx` | Passed place TZ to pickers and slot labels. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Used place TZ for selection and summaries. |
| `src/features/owner/hooks/use-slots.ts` | Queried slots and bulk generation in place TZ. |
| `src/features/owner/components/bulk-slot-modal.tsx` | TZ-aware date selection and previews. |
| `src/features/owner/components/calendar-navigation.tsx` | Set “today” based on place TZ. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Initialized owner calendar with place TZ. |
| `src/features/reservation/components/booking-summary-card.tsx` | Displayed booking times in place TZ. |
| `src/features/reservation/components/order-summary.tsx` | Displayed order date/time in place TZ. |
| `package.json` | Added `@date-fns/tz` dependency. |
| `agent-plans/20-timezone-alignment/*` | Added implementation plan docs. |

## Key Decisions

- Use place IANA timezone as canonical for day boundaries and pricing rules.
- Adopt `@date-fns/tz` for consistent, DST-safe timezone math.

## Next Steps (if applicable)

- [ ] Validate a non-Manila place across DST boundaries in staging.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
