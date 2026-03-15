# Phase 2: Player Journey

**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 1 (Core Navigation)  
**Assigned To:** Dev 1 (see `01-06-dev-checklist-1.md`)

---

## 1. Overview

Connect all player-facing pages into a cohesive flow from discovery to booking to reservation management.

---

## 2. Player Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLAYER JOURNEY                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Landing Page (/)
       │
       ├── [Search] ─────────────────────────┐
       │                                      │
       └── [Browse All Courts] ──────────────┼──► Discovery (/courts)
                                              │          │
       ┌──────────────────────────────────────┘          │
       │                                                  │
       │    [Filter by city/type]                        │
       │    [Search refine]                              │
       │                                                  │
       │                                      ┌───────────┘
       │                                      │
       │                              [Click Court Card]
       │                                      │
       │                                      ▼
       │                          Court Detail (/courts/[id])
       │                                      │
       │                      ┌───────────────┼───────────────┐
       │                      │               │               │
       │              [Contact Info]   [Select Slot]    [View Photos]
       │              (Curated only)         │
       │                                      │
       │                              ┌───────┴───────┐
       │                              │               │
       │                         Authenticated?    Guest?
       │                              │               │
       │                              ▼               ▼
       │                      Booking Flow      Login Page
       │               (/courts/[id]/book/[slotId])  │
       │                              │               │
       │                      [Confirm Booking]      │
       │                              │      [Login Success]
       │                              │               │
       │                              ▼               │
       │                      Reservation Created ◄──┘
       │                              │
       │                              ▼
       │                  Reservation Detail (/reservations/[id])
       │                              │
       │                      [Mark Payment]
       │                              │
       │                              ▼
       │                    Payment Flow (/reservations/[id]/payment)
       │                              │
       │                      [Submit Payment Proof]
       │                              │
       │                              ▼
       │                      Success Toast
       │                              │
       │                              ▼
       └────────────────────► My Reservations (/reservations)
                                      │
                              [View Details] ──► Reservation Detail
                                      │
                              [Book Again] ──► Discovery
```

---

## 3. Navigation Links

### 3.1 Landing Page Links

| Element | Action | Destination |
|---------|--------|-------------|
| Search submit | Navigate with query | `/courts?q={searchTerm}` |
| Popular location | Navigate with city filter | `/courts?city={city}` |
| Browse All Courts | Navigate | `/courts` |
| Featured court card | Navigate | `/courts/[id]` |

### 3.2 Discovery Page Links

| Element | Action | Destination |
|---------|--------|-------------|
| Court card | Navigate | `/courts/[id]` |
| Search/filter | Update URL params | `/courts?{params}` |

### 3.3 Court Detail Page Links

| Element | Action | Destination |
|---------|--------|-------------|
| Back button | Navigate back | Browser history or `/courts` |
| Time slot (auth) | Navigate | `/courts/[id]/book/[slotId]` |
| Time slot (guest) | Redirect to login | `/login?redirect=/courts/[id]` |
| Organization name | Navigate (future) | `/org/[slug]` |

### 3.4 Booking Page Links

| Element | Action | Destination |
|---------|--------|-------------|
| Cancel | Navigate back | `/courts/[id]` |
| Confirm | Create & redirect | `/reservations/[id]` |

### 3.5 Reservation Detail Links

| Element | Action | Destination |
|---------|--------|-------------|
| Back | Navigate | `/reservations` |
| Court name | Navigate | `/courts/[id]` |
| Mark Payment | Navigate | `/reservations/[id]/payment` |

### 3.6 Payment Page Links

| Element | Action | Destination |
|---------|--------|-------------|
| Cancel | Navigate back | `/reservations/[id]` |
| Submit | Update & redirect | `/reservations` with success toast |

### 3.7 My Reservations Links

| Element | Action | Destination |
|---------|--------|-------------|
| Reservation row | Navigate | `/reservations/[id]` |
| Empty state CTA | Navigate | `/courts` |

---

## 4. Auth-Gated Actions

### 4.1 Reserve Button Behavior

**Location:** `src/app/(public)/courts/[id]/page.tsx`

```typescript
// When user clicks "Reserve" or a time slot

if (!isAuthenticated) {
  // Redirect to login with return URL
  router.push(`/login?redirect=${encodeURIComponent(`/courts/${courtId}`)}`);
  return;
}

// Proceed to booking
router.push(`/courts/${courtId}/book/${slotId}`);
```

### 4.2 Login Redirect Handling

**Location:** `src/app/(auth)/login/page.tsx`

After successful login:
```typescript
const searchParams = useSearchParams();
const redirect = searchParams.get("redirect") || "/courts";

// After login success
router.push(redirect);
```

### 4.3 Guest-Friendly UI

Show different UI for guests on court detail:

```typescript
// Time slot component
{isAuthenticated ? (
  <Button onClick={() => handleReserve(slot.id)}>
    Reserve
  </Button>
) : (
  <Button variant="outline" onClick={() => router.push(`/login?redirect=...`)}>
    Sign in to reserve
  </Button>
)}
```

---

## 5. Cross-Page Links

### 5.1 Navbar Links (Authenticated)

| Menu Item | Destination |
|-----------|-------------|
| My Reservations | `/reservations` |
| Profile | `/profile` |

### 5.2 Profile Page Links

| Element | Destination |
|---------|-------------|
| View Reservations | `/reservations` |
| Edit Profile | Stay on page (form) |

### 5.3 Empty State CTAs

| Page | Empty State CTA | Destination |
|------|-----------------|-------------|
| My Reservations | "Browse Courts" | `/courts` |
| Discovery (no results) | "Clear Filters" | `/courts` |

---

## 6. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/(public)/courts/[id]/page.tsx` | Update | Add auth check for reserve action |
| `src/app/(auth)/login/page.tsx` | Update | Handle redirect param after login |
| `src/features/discovery/components/time-slot.tsx` | Update | Guest vs auth state UI |
| `src/app/(auth)/reservations/page.tsx` | Update | Add empty state with CTA |

---

## 7. URL State Management

### 7.1 Discovery Filters

The discovery page should preserve filters in URL:

```
/courts?q=manila&city=Metro+Manila&type=RESERVABLE&isFree=false
```

Use `nuqs` for URL state (already in project):

```typescript
import { useQueryState } from "nuqs";

const [query, setQuery] = useQueryState("q");
const [city, setCity] = useQueryState("city");
const [courtType, setCourtType] = useQueryState("type");
const [isFree, setIsFree] = useQueryState("isFree");
```

### 7.2 Reservation Filters

```
/reservations?status=upcoming
```

---

## 8. Breadcrumbs

For nested pages, show breadcrumbs:

### Court Detail
```
Courts > Court Name
```

### Booking
```
Courts > Court Name > Book
```

### Reservation Detail
```
My Reservations > Reservation #ABC123
```

### Payment
```
My Reservations > Reservation #ABC123 > Payment
```

---

## 9. Acceptance Criteria

- [ ] Landing page search navigates to `/courts?q={query}`
- [ ] Popular location links navigate to `/courts?city={city}`
- [ ] Court cards link to court detail page
- [ ] Time slots show "Sign in to reserve" for guests
- [ ] Reserve action redirects to login for guests
- [ ] Login redirects back to original page after success
- [ ] Booking success redirects to reservation detail
- [ ] Payment success redirects to reservations list
- [ ] My Reservations has empty state with "Browse Courts" CTA
- [ ] Navbar "My Reservations" link works
- [ ] All back buttons work correctly
