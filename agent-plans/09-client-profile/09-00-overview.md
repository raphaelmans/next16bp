# 09 - Client Profile - Implementation Plan

**Version:** 1.0  
**Created:** January 8, 2025  
**Status:** Ready for Implementation

---

## Overview

This plan fixes the broken profile functionality that blocks the booking flow. The profile hooks are not connected to the backend, causing profile data to always be `null` and updates to fail.

### User Stories Covered

| ID | Story | Priority |
|----|-------|----------|
| US-09-01 | Player Views Profile | High |
| US-09-02 | Player Updates Profile | High |
| US-09-03 | Profile Completeness for Booking | High |

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/09-client-profile/` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7, 8.5 |
| Investigation Report | Task output from initial analysis |

---

## Problem Summary

### Root Cause

`src/features/reservation/hooks/use-profile.ts` contains placeholder implementations:

```typescript
// BROKEN: Always returns null
export function useProfile() {
  return useQuery({
    queryFn: async () => null as Profile | null,
  });
}

// BROKEN: Always throws error
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data) => {
      throw new Error("Not implemented");
    },
  });
}
```

### Impact

- Profile page at `/account/profile` cannot load data
- Profile updates always fail
- Booking flow always shows "incomplete profile"
- Players cannot book courts (blocked)

---

## Development Phases

| Phase | Description | Modules | Time Est. |
|-------|-------------|---------|-----------|
| 1 | Wire Frontend Hooks | 1A | 30 min |
| 2 | Add Backend Validation | 2A, 2B, 2C | 30 min |
| 3 | Update UI | 3A, 3B | 30 min |

**Total Estimated Time:** 1.5 hours

---

## Module Index

### Phase 1: Wire Frontend Hooks

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Fix Profile Hooks | Connect to tRPC endpoints | `09-01-frontend-hooks.md` |

### Phase 2: Add Backend Validation

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Add Error Class | IncompleteProfileError | `09-02-backend-validation.md` |
| 2B | Validate in Use Cases | Check profile before booking | `09-02-backend-validation.md` |
| 2C | Handle Error in Router | Map to tRPC error | `09-02-backend-validation.md` |

### Phase 3: Update UI

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Update Form Labels | Clarify requirements | `09-03-ui-polish.md` |
| 3B | Fix Completeness Check | Either email OR phone | `09-03-ui-polish.md` |

---

## Dependencies

```
Phase 1 (Hooks) ────► Phase 2 (Backend) ────► Phase 3 (UI)
```

All phases are sequential - each depends on the previous.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Completeness requirement | displayName + (email OR phone) | Flexible, ensures one contact method |
| Avatar upload | Defer (button visible but non-functional) | Not blocking, can be added later |
| Profile page location | `/account/profile` | Already established |
| Backend validation | Add to use-cases | Prevents API bypass, ensures data quality |

---

## Profile Completeness Logic

```typescript
// Frontend and backend both use this logic
const isProfileComplete = 
  !!profile?.displayName && 
  (!!profile?.email || !!profile?.phoneNumber);
```

**Required:** Display name + at least one contact method (email or phone)

---

## Files to Modify

| Phase | File | Changes |
|-------|------|---------|
| 1 | `src/features/reservation/hooks/use-profile.ts` | Wire to tRPC |
| 2 | `src/modules/profile/errors/profile.errors.ts` | Add IncompleteProfileError |
| 2 | `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts` | Add validation |
| 2 | `src/modules/reservation/use-cases/create-free-reservation.use-case.ts` | Add validation |
| 2 | `src/modules/reservation/reservation.router.ts` | Handle new error |
| 3 | `src/features/reservation/components/profile-form.tsx` | Update labels (optional) |
| 3 | `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Fix completeness check |

---

## Testing Checklist

### Phase 1 (Frontend Hooks)
- [ ] Profile loads on `/account/profile`
- [ ] Form shows existing data
- [ ] Save changes works
- [ ] Success toast appears
- [ ] Profile persists after refresh

### Phase 2 (Backend Validation)
- [ ] API rejects booking with incomplete profile
- [ ] Error message is clear
- [ ] Complete profile: booking succeeds
- [ ] Error code is INCOMPLETE_PROFILE

### Phase 3 (UI Polish)
- [ ] Booking page shows correct status
- [ ] Either email OR phone satisfies requirement
- [ ] Labels indicate what's needed

---

## Document Index

| Document | Description |
|----------|-------------|
| `09-00-overview.md` | This file - master plan |
| `09-01-frontend-hooks.md` | Phase 1: Wire hooks to tRPC |
| `09-02-backend-validation.md` | Phase 2: Add backend guards |
| `09-03-ui-polish.md` | Phase 3: UI improvements |

---

## Success Criteria

- [ ] Profile page loads real data
- [ ] Profile updates work
- [ ] Backend validates profile completeness
- [ ] Booking flow works with complete profiles
- [ ] Clear error messages for incomplete profiles
- [ ] Build passes with no TypeScript errors
