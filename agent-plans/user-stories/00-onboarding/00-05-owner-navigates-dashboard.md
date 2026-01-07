# US-00-05: Owner Navigates Dashboard

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **navigate the owner dashboard with a consistent sidebar and breadcrumbs** so that **I can efficiently manage my courts and reservations**.

---

## Acceptance Criteria

### Sidebar Navigation

- Given I am on any `/owner/*` page
- When I view the sidebar
- Then I see: Dashboard, My Courts, Reservations, Settings
- And the current page is highlighted with active state

### Active State

- Given I am on `/owner/courts`
- When I view the sidebar
- Then "My Courts" has: bg-primary/10, text-primary, left border accent

### Breadcrumbs on Nested Pages

- Given I am on `/owner/courts/new`
- When I view the page header
- Then I see breadcrumbs: My Courts > New Court
- And I see a back button to `/owner/courts`

- Given I am on `/owner/courts/[id]/slots`
- When I view the page header
- Then I see breadcrumbs: My Courts > {Court Name} > Manage Slots
- And I see a back button to `/owner/courts`

### Cross-Dashboard Navigation

- Given I am on the owner dashboard
- When I click the user dropdown
- Then I see: Back to Player View (`/courts`), My Reservations, Admin Dashboard (if admin), Profile, Sign Out

### Logo Navigation

- Given I am on any owner page and click the logo
- Then I navigate to `/home`

---

## Edge Cases

- Owner has no courts - Show empty state on courts page with "Add Court" CTA
- Owner has no organization - Redirect to `/owner/onboarding`
- Mobile view - Sidebar collapses to hamburger menu

---

## Navigation Patterns

| Page | Sidebar Active | Breadcrumbs | Back Button |
|------|----------------|-------------|-------------|
| `/owner` | Dashboard | No | No |
| `/owner/courts` | My Courts | No | No |
| `/owner/courts/new` | My Courts | My Courts > New Court | Yes, `/owner/courts` |
| `/owner/courts/[id]/slots` | My Courts | My Courts > {Name} > Slots | Yes, `/owner/courts` |
| `/owner/reservations` | Reservations | No | No |
| `/owner/settings` | Settings | No | No |

---

## Sidebar Structure

```
┌─────────────────────────┐
│ [Org Switcher]          │  (if multiple orgs)
├─────────────────────────┤
│ LayoutDashboard         │
│ Dashboard         /owner│
├─────────────────────────┤
│ MapPin                  │
│ My Courts  /owner/courts│  ← Active: bg-primary/10
├─────────────────────────┤
│ CalendarDays            │
│ Reservations            │
│       /owner/reservations│
├─────────────────────────┤
│ Settings                │
│ Settings /owner/settings│
└─────────────────────────┘
```

---

## Owner Navbar Dropdown

```
┌─────────────────────────┐
│ Back to Player View     │ → /courts
├─────────────────────────┤
│ My Reservations         │ → /reservations
├─────────────────────────┤
│ Admin Dashboard         │ → /admin (if admin)
├─────────────────────────┤
│ Profile                 │ → /account/profile
│ Settings                │ → /owner/settings
├─────────────────────────┤
│ Sign Out                │
└─────────────────────────┘
```

---

## References

- Design System: Section 5.2 (Cards), Section 4.4 (Bento Grid)
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
