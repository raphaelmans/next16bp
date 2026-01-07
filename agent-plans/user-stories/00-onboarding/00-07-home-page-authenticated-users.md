# US-00-07: Home Page for Authenticated Users

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **authenticated user**, I want to **see a personalized home page after login** so that **I can quickly access my bookings, profile, and relevant actions**.

---

## Acceptance Criteria

### Welcome Header

- Given I am authenticated with a display name
- When I visit `/home`
- Then I see "Welcome back, {displayName}"

- Given I am authenticated without a display name
- When I visit `/home`
- Then I see "Welcome back!"

### Quick Actions

- Given I am on `/home`
- When I view quick actions
- Then I see cards for: Find Courts, My Bookings, Profile

- Given I have an organization
- When I view quick actions
- Then I also see "Owner Dashboard" card

- Given I am an admin
- When I view quick actions
- Then I also see "Admin Dashboard" card

### Upcoming Reservations

- Given I have upcoming reservations
- When I view the Upcoming Reservations section
- Then I see up to 3 reservations with court name, location, date/time, and status badge

- Given I have no upcoming reservations
- When I view the Upcoming Reservations section
- Then I see an empty state with "Browse Courts" CTA

### Your Organization Section

- Given I have an organization
- When I view the Your Organization section
- Then I see: organization name, court count, pending reservations count, "Go to Dashboard" link

- Given I have no organization
- When I view the Your Organization section
- Then I see "Become a Court Owner" CTA card

### Profile Completion Banner

- Given my profile is incomplete (missing displayName or both email and phone)
- When I view `/home`
- Then I see a dismissible banner prompting me to complete my profile

- Given I dismiss the profile banner
- When I return to `/home`
- Then the banner is not shown (persisted in localStorage)

### Login Redirect

- Given I successfully log in
- When no `?redirect` param is provided
- Then I am redirected to `/home`

### Logo Navigation

- Given I am authenticated and click the logo in any navbar
- Then I navigate to `/home`

---

## Edge Cases

- User has no display name - Show "Welcome back!" without name
- User dismisses profile banner - Persist in localStorage, don't show again
- User has multiple organizations - Show first/primary organization
- Reservations loading - Show skeleton cards
- API error - Show error state with retry option
- All reservations are past - Show empty state (no upcoming)

---

## Page Layout

### Desktop (lg+)

```
┌────────────────────────────────────────────────────────────┐
│ Welcome back, {displayName}                                │
├────────────────────────────────────────────────────────────┤
│ [Find Courts] [My Bookings] [Profile] [Owner?] [Admin?]    │
├────────────────────────────────┬───────────────────────────┤
│ Upcoming Reservations          │ Your Organization         │
│ (col-span-8)                   │ (col-span-4)              │
├────────────────────────────────┴───────────────────────────┤
│ Complete Your Profile (if needed)                          │
└────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌────────────────────────┐
│ Welcome back!          │
├────────────────────────┤
│ [Find] [Bookings]      │
│ [Profile] [Owner?]     │
├────────────────────────┤
│ Complete Profile       │
├────────────────────────┤
│ Upcoming Reservations  │
├────────────────────────┤
│ Your Organization      │
└────────────────────────┘
```

---

## Quick Action Cards

| Action | Icon (Lucide) | Href | Condition |
|--------|---------------|------|-----------|
| Find Courts | `Search` | `/courts` | Always |
| My Bookings | `CalendarDays` | `/reservations` | Always |
| Profile | `User` | `/account/profile` | Always |
| Owner Dashboard | `Building2` | `/owner` | `hasOrganization` |
| Admin Dashboard | `Shield` | `/admin` | `isAdmin` |

**Card Styling (per Design System):**
- bg: card
- border: 1px solid border
- border-radius: 16px (radius-xl)
- padding: 24px (space-6)
- shadow: shadow-sm
- Hover: shadow-md, translateY(-2px), border-color: primary
- Icon: 24px, text-muted-foreground, hover: text-primary
- Label: Outfit 600, 14px

---

## Organization Section Variants

### With Organization

```
┌─────────────────────────────────────────┐
│ {Organization Name}                     │
│                                         │
│ ┌─────────┐  ┌─────────┐               │
│ │    3    │  │    2    │               │
│ │  Courts │  │ Pending │               │
│ └─────────┘  └─────────┘               │
│                                         │
│ Go to Dashboard →                       │
└─────────────────────────────────────────┘
```

### Without Organization (CTA)

```
┌─────────────────────────────────────────┐
│ [Building2 Icon - Orange]               │
│                                         │
│ Have courts to share?                   │
│                                         │
│ List your pickleball courts and start   │
│ accepting reservations today.           │
│                                         │
│ [Become a Court Owner]                  │
└─────────────────────────────────────────┘

Styling:
- bg: accent-light (#FFEDD5)
- border: 1px solid accent/20
```

---

## Data Requirements

| Data | tRPC Call | Notes |
|------|-----------|-------|
| Profile | `profile.me` | For displayName, completeness check |
| Upcoming reservations | `reservation.getMyReservations` | Filter future, limit 3 |
| Organization | `organization.my` | First org if multiple |
| Court count | `courtManagement.getMyCourts` | Count for org stats |
| Pending count | New endpoint needed | Count PAYMENT_MARKED reservations |
| Is Admin | Session | `ctx.session.role === 'admin'` |

---

## References

- PRD: Section 4.1 (Player persona)
- Design System: `business-contexts/kudoscourts-design-system.md`
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
