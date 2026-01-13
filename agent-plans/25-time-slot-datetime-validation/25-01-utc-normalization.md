# Phase 1: UTC Normalization for Time Slots

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-05-01

---

## Objective

Ensure all time slot payloads and availability queries send UTC `Z` timestamps while still using `place.timeZone` for local calculations.

---

## Modules

### Module 1A: Shared UTC ISO helper + hook updates

**User Story:** `US-05-01`  
**Reference:** `25-00-overview.md`

#### Directory Structure

```
src/shared/lib/time-zone.ts
src/features/owner/hooks/use-slots.ts
src/features/discovery/hooks/use-court-detail.ts
src/features/discovery/hooks/use-place-detail.ts
```

#### API Touchpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `timeSlot.createBulk` | Mutation | `{ courtId, slots: [{ startTime, endTime, ... }] }` | `TimeSlot[]` |
| `timeSlot.getForCourt` | Query | `{ courtId, startDate, endDate }` | `TimeSlot[]` |
| `timeSlot.getAvailable` | Query | `{ courtId, startDate, endDate }` | `TimeSlot[]` |
| `availability.getForCourt` | Query | `{ courtId, date, durationMinutes }` | `AvailabilityOption[]` |

#### Implementation Steps

1. Add `toUtcISOString` helper to normalize ISO strings.
2. Update `getZonedStartOfDayIso` to return UTC.
3. Replace `TZDate.toISOString()` usage in `use-slots` with `toUtcISOString`.
4. Replace `TZDate.toISOString()` usage in `use-court-detail` with `toUtcISOString`.
5. Keep bulk slot payloads UTC by using `toUtcISOString` for slot start/end.

#### Testing Checklist

- [ ] Create bulk slots for a non-UTC place and confirm UTC `Z` payloads.
- [ ] Load slot list and verify no datetime validation errors.
- [ ] Fetch available slots for a selected day without errors.

#### Handoff Notes

- Share UTC normalization helper with other timezone-related utilities.

---

## Phase Completion Checklist

- [ ] UTC ISO helper shipped
- [ ] Owner + discovery hooks updated
- [ ] No validation errors for `+08:00` offsets
