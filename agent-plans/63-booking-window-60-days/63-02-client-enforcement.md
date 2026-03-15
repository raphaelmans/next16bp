# Phase 2: Client Enforcement

**Dependencies:** Phase 1 (shared constant) recommended

---

## Objective

Prevent users from selecting dates beyond 60 days ahead in public booking UIs and owner slot creation.

---

## Module 2A: Public booking date pickers

Use `KudosDatePicker`'s existing `maxDate` prop.

Targets:

- `src/features/discovery/components/booking-card.tsx`
- `src/app/(public)/places/[placeId]/page.tsx`
- `src/app/(public)/courts/[id]/schedule/page.tsx` (day view)

Implementation notes:

- Compute `maxDate` in the place timezone:
  - `const maxDate = addDays(getZonedToday(placeTimeZone), MAX_BOOKING_WINDOW_DAYS);`
- Pass `maxDate={maxDate}` into `KudosDatePicker`.
- Keep existing min-date behavior (today in timezone).

---

## Module 2B: Public schedule month calendar cap

**File:** `src/app/(public)/courts/[id]/schedule/page.tsx`

The month view uses `<Calendar />` directly (react-day-picker). Add:

- `toMonth={maxMonthStart}` to prevent navigating beyond the allowed month.
- Extend `disabled` to include `date > maxDate`.

This ensures users cannot browse or pick a day beyond 60 days ahead.

---

## Module 2C: Owner bulk slot modal caps

**File:** `src/features/owner/components/bulk-slot-modal.tsx`

The modal uses `<Calendar />` directly.

- Add `maxDate` cap to:
  - single-day calendar
  - recurring start-date calendar
  - recurring end-date calendar

Rules:

- `date < today` remains invalid.
- `date > maxDate` invalid.
- end date additionally must be `>= startDate`.

---

## QA Checklist

- [ ] Date pickers do not allow selecting dates after (today + 60 days).
- [ ] Schedule month view cannot navigate beyond the max month.
- [ ] Owner bulk modal end date cannot exceed the max.
