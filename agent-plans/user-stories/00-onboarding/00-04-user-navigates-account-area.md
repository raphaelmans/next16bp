# US-00-04: User Navigates Account Area

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **authenticated user**, I want to **navigate account-related pages with clear back navigation** so that **I can manage my profile and reservations without getting lost**.

---

## Acceptance Criteria

### Profile Page Navigation

- Given I am on `/account/profile`
- When I view the page header
- Then I see breadcrumbs: Account > Profile
- And I see a back button to `/home`

### Reservations List

- Given I am on `/reservations`
- When I view the page header
- Then I see title "My Reservations" (top-level, no breadcrumbs needed)

### Reservation Detail

- Given I am on `/reservations/[id]`
- When I view the page header
- Then I see breadcrumbs: My Reservations > Details
- And I see a back button to `/reservations`

### Payment Page

- Given I am on `/reservations/[id]/payment`
- When I view the page header
- Then I see breadcrumbs: My Reservations > Details > Payment
- And I see a back button to `/reservations/[id]`

### Cross-Navigation

- Given I am on any account page
- When I use the navbar dropdown
- Then I can navigate to: Home, Courts, Owner Dashboard (if owner), Admin Dashboard (if admin)

---

## Edge Cases

- Direct link to payment page - Breadcrumbs render correctly
- Reservation not found - Show 404 with link back to `/reservations`
- User not authorized for reservation - Redirect to `/reservations` with error toast

---

## Navigation Patterns

| Page | Breadcrumbs | Back Button | Back Destination |
|------|-------------|-------------|------------------|
| `/account/profile` | Account > Profile | Yes | `/home` |
| `/reservations` | My Reservations | No | - |
| `/reservations/[id]` | My Reservations > Details | Yes | `/reservations` |
| `/reservations/[id]/payment` | ...Details > Payment | Yes | `/reservations/[id]` |

---

## Page Header Component

All account pages should use a consistent `PageHeader` component:

```tsx
<PageHeader
  title="Profile"
  breadcrumbs={[
    { label: "Account", href: "/home" },
    { label: "Profile" }
  ]}
  backHref="/home"
  backLabel="Back to Home"
/>
```

---

## References

- Design System: Section 4 (Spacing & Layout)
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
