# US-11-01: Unified Navigation Shells

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **platform user**, I want **consistent navigation between public and authenticated areas** so that **I can move through the product without confusion**.

---

## Acceptance Criteria

### Public Routes Use Navbar Only

- Given I am on a public route (`/`, `/courts`, `/courts/[id]`)
- When I view the header
- Then I see a consistent navbar (logo, browse courts, auth/user actions)
- And no sidebar is displayed on public routes

### Authenticated Routes Use Sidebar Shell

- Given I am authenticated and on an app route (`/home`, `/reservations`, `/account/profile`, `/owner/*`, `/admin/*`)
- When I view the layout
- Then I see a sidebar with role-based navigation
- And the active item is clearly highlighted

### Role-Based Navigation

- Given I am a player
- When I view the sidebar
- Then I see player routes only

- Given I am an owner
- When I view the sidebar
- Then I see owner routes in addition to player routes

- Given I am an admin
- When I view the sidebar
- Then I see admin routes in addition to player routes

### Mobile Navigation Parity

- Given I am on mobile
- When I open the navigation
- Then I see the same links as desktop without missing actions

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Auth state changes | Navbar or sidebar updates without reload |
| Long org/user names | Truncate with ellipsis without layout shift |
| User has owner + admin | Both dashboards appear in navigation |
| Unrecognized role | Default to player navigation |

---

## References

- PRD: Navigation consistency across roles
- Related: `agent-plans/user-stories/00-onboarding/00-03-user-navigates-public-area.md`
- Related: `agent-plans/user-stories/00-onboarding/00-05-owner-navigates-dashboard.md`
