# Owner Reservations Filtering (Place/Court) - Implementation Plan

**Domain:** 14-place-court-migration  
**Status:** Proposed  
**User Stories:** US-14-11 (primary), US-14-12 (related navigation), US-14-13 (related owner guidance)

---

## Problem Statement

The owner reservations view can show a non-zero “Pending Action” badge while rendering an empty results table when the URL contains a `placeId` filter.

Example repro:
- `/owner/reservations?placeId=<placeId>`
- UI shows `Pending Action 1` but no rows.

---

## Findings (Current Behavior)

### Data exists and is correctly linked

Verified via Supabase:
- Reservation `0d0ca1ba-3482-47b4-9754-8a62b9c47874` exists.
- Status: `CREATED`.
- Court belongs to place `4d206417-177e-40d0-83c3-7e1d11a80177`.
- Reservation is multi-slot (`reservation_time_slot` has 2 links).

### Likely root cause (race / dependency on courts list)

`/owner/reservations` filters by `placeId` **client-side** by mapping `placeId -> courtIds -> reservation.courtId`.

- `placeId` comes from URL/localStorage (`useOwnerPlaceFilter`).
- The courts list comes from `useOwnerCourts`, but the page currently does not treat “courts still loading” as a loading state.
- When `placeId` is present and `courts` is still empty, the computed set of `courtIds` is empty, so it filters out **all** reservations even if the reservation query already returned results.

This creates a UI inconsistency:
- Badge counts (from `reservationOwner.getPendingCount`) can render quickly.
- The reservations list is filtered away until courts load.

### Additional underlying risk (data shape / joins)

Owner reservations are fetched via `reservationOwner.getForOrganization`, implemented by `ReservationRepository.findWithDetailsByOrganization` which joins through `reservation_time_slot`.

Implications:
- Any legacy reservations without `reservation_time_slot` links may not appear.
- Long-term, the query needs backward compatibility or a data backfill.

---

## Goals

1. `/owner/reservations?placeId=...` shows the reservation rows correctly.
2. Filtering does not depend on “courts list finished loading” to avoid empty flashes.
3. Owner filters (place/court) are applied consistently across:
   - `/owner/reservations`
   - `/owner/reservations/active`
   - Reservation alerts panel
4. Counts/badges are consistent with what the table can show.

---

## Proposed Solution (Recommended)

### A) Make filtering server-side (avoid client courtId derivation)

Add optional `placeId` (and continue supporting optional `courtId`) to `reservationOwner.getForOrganization`.

- Server already joins `place` and `court`, so filtering by `place.id` is straightforward.
- This removes the “courts still loading → empty list” failure mode.

Optional enhancement:
- Include `placeId` on the returned DTO (`ReservationWithDetails`) so the UI can also filter client-side without the courts list (useful for other components).

### B) Make UI resilient to async filter dependencies

Even with server-side filtering, keep a UI safety net:
- If `placeId` is set and the courts list is still loading, render a loading skeleton (or defer filtering) instead of showing “no results”.

### C) Fix badge/count semantics

Current count endpoint comment says “pending = PAYMENT_MARKED_BY_USER” but it counts `CREATED` and `PAYMENT_MARKED_BY_USER` and excludes `AWAITING_PAYMENT`.

Decide and implement a consistent definition:
- “Pending Action” (owner action required) likely includes:
  - `CREATED` (needs accept/reject)
  - `PAYMENT_MARKED_BY_USER` (needs confirm/reject)
- “Awaiting Payment” is not necessarily an owner action; should not show in “Pending Action”.

If the UI intends “Pending Action” to include `AWAITING_PAYMENT`, then both:
- count endpoint and
- table filtering
must include it.

Also consider counts with filters:
- When a place filter is active, badge counts should match the filtered view, or the badge should explicitly represent global counts.

---

## Modules / Work Breakdown

### Module 1: Server-side filtering for owner reservations

**Files (likely):**
- `src/modules/reservation/dtos/reservation-owner.dto.ts`
- `src/modules/reservation/reservation-owner.router.ts`
- `src/modules/reservation/services/reservation-owner.service.ts`
- `src/modules/reservation/repositories/reservation.repository.ts`

**Changes:**
- Extend `GetOrgReservationsSchema` with optional `placeId`.
- Extend repository filter object to accept `placeId`.
- Add `place.id = placeId` condition when provided.

Backward-compat decision (choose one):
1) Query compatibility: support reservations that have no `reservation_time_slot` links by falling back to `reservation.time_slot_id`.
2) Data backfill: ensure all existing reservations have corresponding rows in `reservation_time_slot`.

**Acceptance criteria:**
- `reservationOwner.getForOrganization({ organizationId, placeId })` returns reservations for that place regardless of courts list state.

---

### Module 2: Client passes placeId to the server

**Files (likely):**
- `src/features/owner/hooks/use-owner-reservations.ts`
- `src/app/(owner)/owner/reservations/page.tsx`
- `src/app/(owner)/owner/reservations/active/page.tsx`
- `src/features/owner/hooks/use-reservation-alerts.ts`
- `src/features/owner/components/reservation-alerts-panel.tsx`

**Changes:**
- Extend `useOwnerReservations` options to accept `placeId`.
- Pass `placeId` through in tRPC query input.
- Remove or reduce reliance on client-side `courtIds` filtering for place.

**Acceptance criteria:**
- `/owner/reservations?placeId=...` displays reservation rows without waiting for courts list.

---

### Module 3: UI loading/empty-state correctness

**Files (likely):**
- `src/app/(owner)/owner/reservations/page.tsx`
- `src/features/owner/components/reservation-alerts-panel.tsx`
- `src/app/(owner)/owner/reservations/active/page.tsx`

**Changes:**
- Treat “placeId selected + courts still loading” as loading (or show a specific state) to avoid empty screens.

**Acceptance criteria:**
- No “empty list with non-zero badge” transient states.

---

### Module 4: Counts alignment

**Files (likely):**
- `src/modules/reservation/reservation-owner.router.ts`
- `src/modules/reservation/dtos/reservation-owner.dto.ts`
- `src/modules/reservation/services/reservation-owner.service.ts`
- `src/modules/reservation/repositories/reservation.repository.ts`
- `src/features/owner/hooks/use-owner-reservations.ts`

**Changes:**
- Decide whether counts are global or filter-aware.
- Update `getPendingCount` status set and/or add a new endpoint for filter-aware counts.

**Acceptance criteria:**
- “Pending Action” badge definition matches what the “Pending” tab shows.

---

## Risks

- Changing query joins for backward compatibility may affect performance; validate with real data volume.
- If a reservation has slots spanning multiple courts (should not happen), grouping might surface duplicates or ambiguous court naming.
- Count semantics require product decision (“pending action” vs “active queue”).

---

## Validation Checklist

- [ ] Supabase: reservation `0d0ca1ba-3482-47b4-9754-8a62b9c47874` appears under `/owner/reservations?placeId=4d206417-177e-40d0-83c3-7e1d11a80177`.
- [ ] Place filter shows correct rows without needing courts list.
- [ ] Alerts panel and `/owner/reservations/active` remain consistent with filters.
- [ ] `pnpm lint` and `pnpm build` pass.
