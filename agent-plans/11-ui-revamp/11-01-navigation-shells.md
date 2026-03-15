# Phase 1: Navigation Shell Foundation

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-11-01

---

## Objective

Create consistent layout shells for public and authenticated routes, keeping public routes navbar-only and authenticated routes sidebar-based.

---

## Modules

### Module 1A: Public Navbar Shell

**User Story:** `US-11-01`

#### Files

- `src/shared/components/layout/public-shell.tsx` (new)
- `src/features/discovery/components/navbar.tsx` (update)

#### UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Navbar (logo, browse, auth/user menu, mobile drawer)             │
├──────────────────────────────────────────────────────────────────┤
│ Main content (full width, padded)                                │
└──────────────────────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Create `PublicShell` component with navbar + main + footer.
2. Ensure navbar is fixed, consistent on all public routes.
3. Align mobile drawer content with desktop links.

#### Testing Checklist

- [ ] Navbar displays on `/`, `/courts`, `/courts/[id]`
- [ ] Auth state swaps sign-in vs user menu
- [ ] Mobile drawer includes all actions

---

### Module 1B: App Sidebar Shell

**User Story:** `US-11-01`

#### Files

- `src/shared/components/layout/app-shell.tsx` (new)
- `src/shared/components/layout/dashboard-layout.tsx` (update)
- `src/shared/components/layout/app-sidebar.tsx` (new)

#### UI Layout

```
┌──────────────┐┌──────────────────────────────────────────────────┐
│ Sidebar      ││ Topbar (logo + user menu)                        │
│ - Nav items  │├──────────────────────────────────────────────────┤
│ - Active     ││ Main content (full width, padded)                │
└──────────────┘└──────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Create `AppShell` component that composes sidebar + topbar + content.
2. Build `AppSidebar` with role-based nav configuration.
3. Reuse `DashboardLayout` for responsive sidebar behavior.

#### Testing Checklist

- [ ] Player/owner/admin nav items render correctly
- [ ] Active state uses primary tint and border
- [ ] Sidebar collapses to drawer on mobile

---

## Phase Completion Checklist

- [ ] PublicShell created and wired
- [ ] AppShell created and wired
- [ ] Shared nav primitives defined
- [ ] No layout regressions on mobile
