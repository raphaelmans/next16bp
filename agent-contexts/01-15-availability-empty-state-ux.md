# [01-15] Availability Empty State UX

> Date: 2025-01-27
> Previous: 01-14-verification-badge-fix.md

## Summary

Improved the "No Available Start Times" user experience by adding diagnostic metadata to availability API responses and creating a context-aware empty state component that shows helpful messages based on why times are unavailable (no schedule, no pricing, closed, or fully booked).

## Changes Made

### Backend - Availability Diagnostics

| File | Change |
|------|--------|
| `src/modules/availability/services/availability.service.ts` | Added `AvailabilityDiagnostics` and `AvailabilityResult` types. All service methods now return `{ options, diagnostics }` with tracking for `hasHoursWindows`, `hasRateRules`, `dayHasHours`, `allSlotsBooked` |
| `src/modules/availability/dtos/availability.dto.ts` | Added `AvailabilityDiagnosticsSchema` Zod schema |
| `src/modules/availability/availability.router.ts` | Updated all endpoints to return `{ options, diagnostics }` structure |

### Hooks - Response Structure Updates

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-place-detail.ts` | Updated `usePlaceAvailability` hook to extract and expose `diagnostics` from response |
| `src/features/discovery/hooks/use-court-detail.ts` | Updated `useAvailableSlots` hook to handle new `{ options, diagnostics }` response structure |

### Frontend - AvailabilityEmptyState Component

| File | Change |
|------|--------|
| `src/components/availability-empty-state.tsx` | **NEW** - Reusable component with `public` and `owner` variants showing context-aware messages based on diagnostics |

### Public Pages

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Integrated `AvailabilityEmptyState` for day view and month view empty states with contact info |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Replaced generic message with `AvailabilityEmptyState` showing contact info |

### Owner Pages

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Enhanced empty state with diagnostics-aware messages and schedule edit action |

## Key Decisions

- **Diagnostics are aggregated across courts**: When querying multiple courts, diagnostics use OR for `hasHoursWindows`, `hasRateRules`, `dayHasHours` and AND for `allSlotsBooked`
- **Public vs Owner messaging**: Public users see generic "not accepting online bookings" while owners see specific configuration issues
- **Contact info for public users**: When schedule/pricing isn't configured, public users are shown venue contact options (phone, Viber, website, Facebook)
- **`role="status"` for accessibility**: Used informational status role for screen readers (not `alert` since it's not urgent)

## Diagnostic Messages

| Cause | Public Message | Owner Message |
|-------|----------------|---------------|
| No hours configured | "This venue isn't accepting online bookings for this day" | "No schedule hours configured" |
| No pricing rules | "This venue isn't accepting online bookings for this day" | "No pricing rules configured" |
| Closed on day | "Closed on this day. Try another date?" | "No operating hours for this day" |
| Fully booked | "Fully booked for this date. Try another day?" | "All slots are booked" |

## Verification

```bash
pnpm lint   # Passes (known SVG issues, role="status" is intentional)
pnpm build  # Passes
```

Test scenarios:
1. Remove all `court_hours_window` entries → shows "not set up" message
2. Remove all `court_rate_rule` entries → shows "not set up" message
3. Book all slots on a day → shows "fully booked"
4. Owner view → shows diagnostic messages with "Edit schedule & pricing" action
