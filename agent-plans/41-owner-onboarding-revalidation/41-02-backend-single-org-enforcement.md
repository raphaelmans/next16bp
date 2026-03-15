# Phase 2: Backend Single-Organization Enforcement

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** `US-01-01` (Already Has Organization)

---

## Objective

Prevent duplicate organization creation even if a stale UI allows the user to submit onboarding again.

---

## Module 2A: Enforce Single Org Per User

### Files

- `src/modules/organization/services/organization.service.ts`
- `src/modules/organization/errors/organization.errors.ts`
- `src/modules/organization/organization.router.ts`

### Approach

1. Add a domain error: `UserAlreadyHasOrganizationError` (ConflictError).
2. In `OrganizationService.createOrganization`, check `findByOwnerId(ownerId)` inside the transaction.
3. Throw conflict error if an org already exists.
4. Map this domain error to tRPC `CONFLICT` in `organization.router.ts`.

### Notes

- This does not require a DB migration, but a DB unique constraint on `organization.owner_user_id` could be considered later for stronger guarantees.

### Testing Checklist

- [ ] First organization creation succeeds.
- [ ] Second organization creation returns tRPC conflict.
- [ ] Error message is user-safe.
