# Phase 3: Visual Cohesion Polish

**Dependencies:** Phase 2 complete  
**Parallelizable:** No  
**User Stories:** US-11-03

---

## Objective

Apply design system typography and cohesive color rules across navigation, layout shells, and common UI elements.

---

## Modules

### Module 3A: Typography + Color Audit

**User Story:** `US-11-03`

#### Files

- `src/app/layout.tsx`
- `src/features/discovery/components/navbar.tsx`
- `src/features/owner/components/owner-sidebar.tsx`
- `src/features/admin/components/admin-sidebar.tsx`
- `src/shared/components/layout/dashboard-layout.tsx`

#### Implementation Steps

1. Ensure root layout applies heading + body fonts consistently.
2. Normalize nav text to use heading font for labels and buttons.
3. Apply brand color restraint (teal for primary, orange for links/highlights).
4. Replace ad-hoc grays with design system neutrals.

#### Testing Checklist

- [ ] Primary CTAs use teal only
- [ ] Orange reserved for links/availability
- [ ] Red used only for destructive actions
- [ ] Text contrast meets AA

---

## Phase Completion Checklist

- [ ] Typography is consistent on all pages
- [ ] Navigation colors align with design system
- [ ] No conflicting brand color usage
