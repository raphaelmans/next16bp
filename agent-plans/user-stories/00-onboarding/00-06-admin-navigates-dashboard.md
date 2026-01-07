# US-00-06: Admin Navigates Dashboard

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **platform admin**, I want to **navigate the admin dashboard with a consistent sidebar and notification badges** so that **I can efficiently manage claims and curated courts**.

---

## Acceptance Criteria

### Sidebar Navigation

- Given I am on any `/admin/*` page
- When I view the sidebar
- Then I see: Dashboard, Claims (with badge), Courts
- And the current page is highlighted with active state

### Claims Badge

- Given there are pending claim requests
- When I view the sidebar
- Then the Claims item shows a badge with the pending count

### Active State

- Given I am on `/admin/claims`
- When I view the sidebar
- Then "Claims" has: bg-primary/10, text-primary, left border accent

### Breadcrumbs on Nested Pages

- Given I am on `/admin/claims/[id]`
- When I view the page header
- Then I see breadcrumbs: Claims > Claim #{id}
- And I see a back button to `/admin/claims`

- Given I am on `/admin/courts/new`
- When I view the page header
- Then I see breadcrumbs: Courts > New Curated Court
- And I see a back button to `/admin/courts`

### Cross-Dashboard Navigation

- Given I am on the admin dashboard
- When I click the user dropdown
- Then I see: Back to Player View (`/courts`), My Reservations, Owner Dashboard (if owner), Profile, Sign Out

### Logo Navigation

- Given I am on any admin page and click the logo
- Then I navigate to `/home`

---

## Edge Cases

- No pending claims - Badge not shown (or shows 0)
- Admin is also owner - Show Owner Dashboard link in dropdown
- Claim not found - Show 404 with link back to `/admin/claims`
- Mobile view - Sidebar collapses to hamburger menu

---

## Navigation Patterns

| Page | Sidebar Active | Breadcrumbs | Back Button |
|------|----------------|-------------|-------------|
| `/admin` | Dashboard | No | No |
| `/admin/claims` | Claims | No | No |
| `/admin/claims/[id]` | Claims | Claims > Claim #{id} | Yes, `/admin/claims` |
| `/admin/courts` | Courts | No | No |
| `/admin/courts/new` | Courts | Courts > New Curated Court | Yes, `/admin/courts` |

---

## Sidebar Structure

```
┌─────────────────────────┐
│ LayoutDashboard         │
│ Dashboard        /admin │
├─────────────────────────┤
│ Tag                     │
│ Claims    /admin/claims │  [3]  ← Badge for pending
├─────────────────────────┤
│ Building2               │
│ Courts    /admin/courts │
└─────────────────────────┘
```

---

## Admin Navbar Dropdown

```
┌─────────────────────────┐
│ Back to Player View     │ → /courts
├─────────────────────────┤
│ My Reservations         │ → /reservations
├─────────────────────────┤
│ Owner Dashboard         │ → /owner (if owner)
├─────────────────────────┤
│ Profile                 │ → /account/profile
├─────────────────────────┤
│ Sign Out                │
└─────────────────────────┘
```

---

## References

- PRD: Section 4.3 (Platform Admin persona)
- Design System: Section 5.3 (Badges)
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
