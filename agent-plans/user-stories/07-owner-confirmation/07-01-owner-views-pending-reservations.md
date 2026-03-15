# US-07-01: Owner Views Pending Reservations

**Status:** Active  
**Domain:** 07-owner-confirmation  
**PRD Reference:** Section 7 Journey 4  
**Supersedes:** Part of US-03-03

---

## Story

As an **organization owner**, I want to **view pending reservations with full details** so that **I can review booking requests and take appropriate action**.

---

## Context

This story covers the read-only viewing of reservations. The action (confirm/reject) is covered in US-07-02.

Owners need to see **real data** including:
- Player information (who booked)
- Court and slot details (what was booked)
- Amount (how much is owed)

**Previous context:** See `03-court-reservation/03-03-owner-confirms-payment.md` for original story.

---

## Acceptance Criteria

### Access Reservations Page

- Given I am an authenticated owner with organization
- When I navigate to `/owner/reservations`
- Then I see a list of my organization's reservations

### Filter by Status

- Given I am on the reservations page
- When I use the status filter
- Then I can filter by: All, Pending, Confirmed, Cancelled
- And "Pending" shows PAYMENT_MARKED_BY_USER reservations

### View Enriched Data

- Given I am viewing a reservation
- Then I see:
  - **Player info:** Name, email, phone (from snapshot)
  - **Court:** Court name
  - **Slot:** Date, start time, end time
  - **Amount:** Price in formatted currency (e.g., "₱200")
  - **Status:** Badge showing current status
  - **Created:** When the reservation was made

### Pending Badge on Sidebar

- Given I have pending reservations
- When I view the owner sidebar
- Then I see a badge count on "Reservations" menu item
- And the count matches actual pending count

### Dashboard Stat

- Given I am on `/owner` dashboard
- When I view the stats cards
- Then I see "Pending Confirmations: N" with real count
- And clicking navigates to `/owner/reservations?status=pending`

### Empty State

- Given I have no reservations (or no pending)
- When I view the reservations page
- Then I see appropriate empty state message
- And the message differs for "no reservations" vs "no pending"

### Real-Time Updates

- Given a new reservation is created by a player
- When I refresh the page
- Then the new reservation appears in the list
- And pending count is updated

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No reservations | Empty state: "No reservations yet" |
| No pending | When filtered: "No pending reservations" |
| Organization not found | Error, redirect to onboarding |
| Network error | Error state with retry button |
| Many reservations | Pagination or "load more" (TBD) |

---

## Reservation List Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Reservations                                         [Filter: Pending ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Pending]  Juan Dela Cruz                             Jan 10, 2:00 PM  │ │
│ │            Court A • 0917-123-4567                    ₱200             │ │
│ │            juan@email.com                                              │ │
│ │                                                    [Confirm] [Reject]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Pending]  Maria Santos                              Jan 10, 4:00 PM   │ │
│ │            Court B • 0918-456-7890                    ₱300             │ │
│ │            maria@email.com                                             │ │
│ │                                                    [Confirm] [Reject]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Requirements

### Enriched Reservation DTO

Backend needs to return:

```typescript
interface ReservationWithDetails {
  id: string;
  status: ReservationStatus;
  
  // Player info (from snapshots)
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  
  // Court info (joined)
  courtId: string;
  courtName: string;
  
  // Slot info (joined)
  slotStartTime: string;
  slotEndTime: string;
  
  // Pricing (from slot)
  amountCents: number | null;
  currency: string | null;
  
  // Metadata
  createdAt: string;
}
```

### Frontend Mapping

Current `useOwnerReservations` has placeholders. After backend enhancement:

```typescript
// Remove placeholders, use real data:
courtName: data.courtName,          // was: "Court"
startTime: data.slotStartTime,      // was: "--:--"
endTime: data.slotEndTime,          // was: "--:--"
amountCents: data.amountCents,      // was: 0
```

---

## API Integration

### Query: Get Reservations

**Endpoint:** `reservationOwner.getForOrganization`

**Current Input:**
```typescript
{
  organizationId: string,
  courtId?: string,
  status?: ReservationStatus,
  limit: number,
  offset: number
}
```

**Enhanced Response:** See DTO above

### Query: Get Pending Count

**Endpoint:** `reservationOwner.getPendingCount`

**Input:**
```typescript
{
  organizationId: string
}
```

**Response:** `number`

---

## Frontend Hooks

| Hook | File | Status |
|------|------|--------|
| `useOwnerReservations` | `src/features/owner/hooks/use-owner-reservations.ts` | Connected, needs mapping update |
| `useReservationCounts` | Same file | Connected |

---

## Testing Checklist

- [ ] Navigate to `/owner/reservations`
- [ ] See list of reservations
- [ ] Filter by "Pending" works
- [ ] Player name displays correctly
- [ ] Player email displays correctly
- [ ] Player phone displays correctly
- [ ] Court name displays (not placeholder)
- [ ] Slot time displays (not "--:--")
- [ ] Amount displays formatted
- [ ] Status badges show correctly
- [ ] Sidebar badge shows pending count
- [ ] Dashboard stat shows pending count
- [ ] Dashboard click navigates to filtered list
- [ ] Empty state displays when appropriate
- [ ] Error handling works

---

## References

- PRD: Section 7 Journey 4 (Owner Confirms Payment)
- Original: `03-court-reservation/03-03-owner-confirms-payment.md`
- Hook: `src/features/owner/hooks/use-owner-reservations.ts`
- Page: `src/app/(owner)/owner/reservations/page.tsx`
