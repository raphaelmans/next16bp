# US-00-03: User Navigates Public Area

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user**, I want to **navigate the public discovery area with clear wayfinding** so that **I can find courts and understand where I am in the platform**.

---

## Acceptance Criteria

### Navbar (Guest)

- Given I am not authenticated
- When I view the discovery navbar
- Then I see: Logo (links to `/`), Browse Courts, Sign In button

### Navbar (Authenticated)

- Given I am authenticated
- When I view the discovery navbar
- Then I see: Logo (links to `/home`), Browse Courts, User dropdown
- And the dropdown shows: My Reservations, Profile, Owner Dashboard (if owner), Admin Dashboard (if admin), Sign Out

### Logo Navigation

- Given I am authenticated and click the logo
- When on any public page
- Then I navigate to `/home`

- Given I am NOT authenticated and click the logo
- When on any public page
- Then I navigate to `/`

### Court Detail Breadcrumbs

- Given I am on `/courts/[id]`
- When I view the page header
- Then I see breadcrumbs: Home > Courts > {Court Name}

### Booking Flow Breadcrumbs

- Given I am on `/courts/[id]/book/[slotId]`
- When I view the page header
- Then I see breadcrumbs: Courts > {Court Name} > Book
- And I see a back button to `/courts/[id]`

### Mobile Navigation

- Given I am on mobile
- When I tap the hamburger menu
- Then I see a slide-in menu with same links as desktop dropdown

---

## Edge Cases

- Deep link to court detail - Breadcrumbs still render correctly
- Court name very long - Truncate in breadcrumbs with ellipsis
- User switches auth state - Navbar updates without full page reload

---

## Navigation Patterns

| Page | Breadcrumbs | Back Button |
|------|-------------|-------------|
| `/` | No | No |
| `/courts` | No | No |
| `/courts/[id]` | Home > Courts > {Name} | No (breadcrumbs sufficient) |
| `/courts/[id]/book/[slotId]` | Courts > {Name} > Book | Yes, to `/courts/[id]` |

---

## Navbar Structure

### Guest State
```
[Logo] ─── Browse Courts ─────────────────── [Sign In]
```

### Authenticated State
```
[Logo] ─── Browse Courts ─────────────────── [User Dropdown]
                                                 │
                                                 ├─ My Reservations
                                                 ├─ Profile
                                                 ├─ ───────────
                                                 ├─ Owner Dashboard (if owner)
                                                 ├─ Admin Dashboard (if admin)
                                                 ├─ ───────────
                                                 └─ Sign Out
```

---

## References

- Design System: Section 6 (Motion & Interactions)
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
