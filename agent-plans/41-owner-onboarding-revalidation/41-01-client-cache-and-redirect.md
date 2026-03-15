# Phase 1: Client Cache and Redirect

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** `US-01-01`

---

## Objective

Ensure onboarding and owner navigation converge to the correct state after organization creation without using `router.refresh()`.

---

## Module 1A: Onboarding Client Guard + tRPC Invalidation

### Files

- `src/features/organization/components/organization-form.tsx`
- `src/app/(auth)/owner/onboarding/organization-form-client.tsx`
- `src/app/(auth)/owner/onboarding/page.tsx`

### Approach

1. After `organization.create` succeeds, aggressively invalidate org-related tRPC queries.
2. Add a client-side guard on onboarding that refetches `organization.my` on mount and redirects if an org exists.
3. Ensure server-side onboarding redirect goes to `appRoutes.owner.base` (matches user story).

### Flow

```
/owner/onboarding (cached RSC possible)
    │
    ▼
Client guard runs trpc.organization.my (refetchOnMount)
    │
    ├─ if organizations.length > 0 → router.replace("/owner")
    └─ else show OrganizationForm

Submit OrganizationForm
    │
    ▼
organization.create mutation success
    │
    ├─ setData for organization.my (optimistic cache warm)
    └─ invalidate organization router queries
```

### Testing Checklist

- [ ] User with no org: can create org and gets redirected.
- [ ] User with existing org: onboarding immediately redirects away.
- [ ] No client infinite loops (useEffect dependencies stable).
