# Phase 2: Route & Layout Migration

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-11-01, US-11-02

---

## Objective

Align all routes with the correct shell: public routes use the navbar shell; authenticated routes use the sidebar shell with full-width content.

---

## Modules

### Module 2A: Public Route Alignment

**User Story:** `US-11-01`

#### Files

- `src/app/(public)/layout.tsx`
- `src/app/page.tsx` → migrate into public group

#### Implementation Steps

1. Replace direct layout logic with `PublicShell`.
2. Ensure `/` and `/courts` pages render under public layout.
3. Keep footer consistent across public pages.

#### Testing Checklist

- [ ] `/` uses navbar layout
- [ ] `/courts` and `/courts/[id]` remain unchanged visually
- [ ] Footer visible on all public pages

---

### Module 2B: Auth Route Alignment

**User Story:** `US-11-01`, `US-11-02`

#### Files

- `src/app/(auth)/layout.tsx`
- `src/app/(owner)/layout.tsx`
- `src/app/(admin)/layout.tsx`
- `src/app/(auth)/home/page.tsx`
- `src/app/(auth)/reservations/**` and `src/app/(auth)/account/**`

#### Implementation Steps

1. Update authenticated layouts to use `AppShell`.
2. Ensure `/home`, `/reservations`, and `/account/profile` render inside sidebar shell.
3. Keep owner/admin routes using the same shell layout.
4. Remove max-width containers that conflict with full-width requirement.

#### Testing Checklist

- [ ] Sidebar layout visible on `/home`
- [ ] Reservations + profile follow same shell
- [ ] Owner/admin pages retain existing functionality

---

## Phase Completion Checklist

- [ ] Public and auth routes use correct shells
- [ ] Full-width layout verified on mobile/tablet/desktop
- [ ] No duplicate or orphaned routes
