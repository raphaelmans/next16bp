# UI Revamp Dev Checklist

**Focus Area:** Navigation shells, layout migration, visual cohesion
**Modules:** 1A, 1B, 2A, 2B, 3A

---

## Module 1A: Public Navbar Shell

**Reference:** `11-01-navigation-shells.md`  
**User Story:** `US-11-01`

### Setup
- [ ] Create `PublicShell` component
- [ ] Align navbar + footer placement

### Implementation
- [ ] Wire `PublicShell` into public layout
- [ ] Confirm navbar behavior on public routes

### Testing
- [ ] Navbar shows on `/`, `/courts`, `/courts/[id]`
- [ ] Mobile drawer parity

---

## Module 1B: App Sidebar Shell

**Reference:** `11-01-navigation-shells.md`  
**User Story:** `US-11-01`

### Setup
- [ ] Create `AppShell` component
- [ ] Create `AppSidebar` with role-based nav

### Implementation
- [ ] Wire sidebar shell into app layouts
- [ ] Confirm active states

### Testing
- [ ] Sidebar visible on player routes
- [ ] Owner/admin routes intact

---

## Module 2A: Public Route Alignment

**Reference:** `11-02-layout-standards.md`  
**User Story:** `US-11-01`

### Implementation
- [ ] Migrate `/` into public group
- [ ] Validate navbar + footer consistency

---

## Module 2B: Auth Route Alignment

**Reference:** `11-02-layout-standards.md`  
**User Story:** `US-11-01`, `US-11-02`

### Implementation
- [ ] `/home`, `/reservations`, `/account/profile` use sidebar shell
- [ ] Owner/admin routes use same shell

---

## Module 3A: Visual Cohesion Polish

**Reference:** `11-03-visual-cohesion.md`  
**User Story:** `US-11-03`

### Implementation
- [ ] Normalize nav typography
- [ ] Enforce color usage rules

---

## Final Checklist

- [ ] No horizontal scrolling on mobile
- [ ] Consistent nav across roles
- [ ] Colors match design system
- [ ] Typography matches design system
