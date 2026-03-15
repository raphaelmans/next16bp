# Phase 2: Client Cleanup

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-00-05, US-01-01

---

## Objective

Remove client-side redirect loops and isolate client-only navigation in a thin wrapper component.

---

## Modules

### Module 2A: Client Wrapper for Organization Form

**User Story:** `US-01-01`  
**Reference:** `19-02-client-cleanup.md`

#### Directory Structure

```
src/app/(auth)/owner/onboarding/
├── organization-form-client.tsx
```

#### Implementation Steps

1. Create client wrapper with `useRouter`
2. Wire `onSuccess` to `/owner/places/new`
3. Wire `onCancel` to `/home`

#### Testing Checklist

- [ ] Creating org navigates to `/owner/places/new`
- [ ] Cancel navigates to `/home`

---

### Module 2B: Remove Client Redirect Loops

**User Story:** `US-00-05`  
**Reference:** `19-02-client-cleanup.md`

#### Flow Diagram

```
/owner/places/new
  └─ no org → render fallback CTA
```

#### Implementation Steps

1. Remove client `router.push(appRoutes.owner.onboarding)`
2. Render a fallback CTA linking to onboarding
3. Keep owner layout responsible for org gating

#### Testing Checklist

- [ ] No client redirect between onboarding and owner routes
- [ ] Owner pages render fallback CTA when org is missing

---

## Phase Completion Checklist

- [ ] Client wrapper created
- [ ] Redirect loops removed from owner pages
- [ ] UX still allows navigation to onboarding
