# Phase 6: Multi-Court Filtering

**Dependencies:** Phases 1-5 complete  
**Parallelizable:** Yes  
**User Stories:** US-07-06

---

## Objective

Make owner reservation ops usable for owners with multiple courts by adding a consistent court filter (All Courts / specific court) across the reservations list, active queue, and alerts panel.

---

## Modules

### Module 6A: Shared Court Filter State

**User Story:** `US-07-06`

#### Directory Structure

```
src/features/owner/hooks/use-owner-court-filter.ts
src/features/owner/hooks/index.ts
```

#### Behavior

- Source of truth is `courtId` in the URL query param.
- Persist selection to local storage for convenience.
- Changing the filter updates the URL (no full navigation).

#### Testing Checklist

- [ ] No `courtId` param defaults to "All Courts"
- [ ] Selecting a court writes `courtId` to URL
- [ ] Refresh preserves selection

---

### Module 6B: Apply Court Filter to Reservation Ops

**User Story:** `US-07-06`

#### Directory Structure

```
src/app/(owner)/owner/reservations/page.tsx
src/app/(owner)/owner/reservations/active/page.tsx
src/features/owner/components/reservation-alerts-panel.tsx
src/features/owner/hooks/use-reservation-alerts.ts
```

#### Data Requirements

- Use existing backend filtering: `reservationOwner.getForOrganization({ courtId? })`.
- Fetch court list using existing owner endpoint: `courtManagement.getMyCourts`.

#### Testing Checklist

- [ ] `/owner/reservations` filters by court
- [ ] `/owner/reservations/active` filters by court
- [ ] Alerts panel filters by court and preserves filter in "View all" link

---

## Phase Completion Checklist

- [ ] Court filter works across owner reservation surfaces
- [ ] Filter is shareable via URL (`courtId`)
- [ ] No TypeScript errors
