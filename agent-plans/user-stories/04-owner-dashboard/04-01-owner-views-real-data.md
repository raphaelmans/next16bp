# US-04-01: Owner Views Real Dashboard Data

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **Owner**, I want to **see my organization's real courts, reservations, and stats in the dashboard** so that **I can manage my actual business instead of seeing dummy placeholder data**.

---

## Acceptance Criteria

### Courts List Shows Real Data

- Given I am an owner with organization "Rethndr"
- When I visit `/owner/courts`
- Then I see my real courts (or empty state if none)
- And the sidebar shows "Rethndr" as my organization name

### Empty State When No Courts

- Given I am an owner with 0 courts
- When I visit `/owner/courts`
- Then I see the empty state with "Add Your First Court" CTA
- And clicking the CTA navigates to `/owner/courts/new`

### Dashboard Shows Real Stats

- Given I am an owner
- When I visit `/owner` (dashboard)
- Then I see:
  - Active Courts: real count from my courts
  - Pending Reservations: real count from `getPendingCount`
- And "Coming Soon" placeholders for Today's Bookings and Revenue

### Reservations Show Real Data

- Given I am an owner with reservations
- When I visit `/owner/reservations`
- Then I see my real reservations (or empty state if none)
- And I can filter by my real courts
- And I can confirm/reject reservations with real backend calls

### Settings Show Real Organization

- Given I am an owner of organization "Rethndr"
- When I visit `/owner/settings`
- Then the form is pre-filled with "Rethndr" and my real organization data
- And saving changes updates the real organization in the database

### Logo Upload Shows Coming Soon

- Given I am on `/owner/settings`
- When I click "Upload Logo"
- Then I see a toast message "Coming Soon"
- And the upload does not proceed

---

## Edge Cases

- Owner has 0 courts - Show `CourtsEmptyState` component
- Owner has 0 reservations - Show "No reservations yet" message
- Owner has no pending reservations - Pending count shows 0
- Organization query fails - Show error toast, allow retry
- Network error during save - Show error toast with retry option
- Concurrent edit of organization - Last write wins (no conflict resolution for MVP)

---

## UI Components

| Page | Route | Key Components |
|------|-------|----------------|
| Dashboard | `/owner` | StatsCard (2), PendingActions, ComingSoonCard (2) |
| Courts | `/owner/courts` | CourtsTable, CourtsEmptyState |
| Reservations | `/owner/reservations` | ReservationsTable, filter dropdowns |
| Settings | `/owner/settings` | OrganizationForm, DangerZone |

---

## Data Flow

### Shared Organization Context

All owner pages use `useOwnerOrganization()` hook:
```
trpc.organization.my → returns user's orgs → use first org
```

### Courts Page

```
useOwnerCourts() → trpc.courtManagement.getMyCourts
useDeactivateCourt() → trpc.courtManagement.deactivate
```

### Dashboard

```
useOwnerStats() → derived from:
  - trpc.courtManagement.getMyCourts (court count)
  - trpc.reservationOwner.getPendingCount (pending count)
```

### Reservations Page

```
useOwnerReservations() → trpc.reservationOwner.getForOrganization
useConfirmReservation() → trpc.reservationOwner.confirmPayment
useRejectReservation() → trpc.reservationOwner.reject
```

### Settings Page

```
useCurrentOrganization() → trpc.organization.my
useUpdateOrganization() → trpc.organization.update + updateProfile
```

---

## Implementation Phases

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Create `useOwnerOrganization` shared hook | 30 min |
| 2 | Wire `/owner/courts` to real data | 45 min |
| 3 | Wire `/owner` dashboard stats | 1 hour |
| 4 | Wire `/owner/reservations` to real data | 1 hour |
| 5 | Wire `/owner/settings` to real data | 45 min |
| 6 | Verify empty states and test | 30 min |

**Total:** ~5 hours

---

## Files to Modify

### New Files

| File | Purpose |
|------|---------|
| `src/features/owner/hooks/use-owner-organization.ts` | Shared organization context hook |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/owner/hooks/use-owner-courts.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/use-owner-dashboard.ts` | Replace mocks, simplify stats |
| `src/features/owner/hooks/use-owner-reservations.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/use-organization.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/index.ts` | Export new hook |
| `src/app/(owner)/owner/page.tsx` | Use real org, add Coming Soon placeholders |
| `src/app/(owner)/owner/courts/page.tsx` | Use real org |
| `src/app/(owner)/owner/reservations/page.tsx` | Use real org and courts |
| `src/app/(owner)/owner/settings/page.tsx` | Use real org, Coming Soon toast |

### Deferred (Keep Mock)

| File | Reason |
|------|--------|
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Separate story for slots management |
| `src/features/owner/hooks/use-slots.ts` | Depends on time slot backend enhancements |

---

## Backend Endpoints Used

| Router | Endpoint | Purpose |
|--------|----------|---------|
| `organization.my` | Get user's organizations | Shared context |
| `organization.update` | Update org basic info | Settings page |
| `organization.updateProfile` | Update org profile | Settings page |
| `courtManagement.getMyCourts` | Get owner's courts | Courts list, stats |
| `courtManagement.deactivate` | Deactivate a court | Courts list action |
| `reservationOwner.getForOrganization` | Get org reservations | Reservations list |
| `reservationOwner.getPendingCount` | Count pending | Dashboard stats |
| `reservationOwner.confirmPayment` | Confirm reservation | Reservations action |
| `reservationOwner.reject` | Reject reservation | Reservations action |

---

## References

- PRD: Section 4.2 (Owner persona), Section 5.3 (Court Management)
- Context: `agent-contexts/00-01-kudoscourts-server.md` (backend endpoints)
- Context: `agent-contexts/00-04-ux-flow-implementation.md` (current UI state)
