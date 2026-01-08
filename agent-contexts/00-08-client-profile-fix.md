# [00-08] Client Profile Fix - Unblock Booking Flow

> Date: 2025-01-08
> Previous: 00-07-availability-management-complete.md

## Summary

Fixed critical blocking issue where profile hooks were not connected to the backend, preventing players from viewing/updating their profiles and completely blocking the booking flow. Implemented full profile management with backend validation to ensure data quality.

## Problem Addressed

The profile functionality had placeholder implementations that always failed:
- `useProfile()` returned `null` instead of calling `trpc.profile.me`
- `useUpdateProfile()` threw "Not implemented" error
- Profile page at `/account/profile` could not load or save data
- Booking flow always showed "incomplete profile" even when complete
- Players could not book courts (complete blocker)

## Changes Made

### Phase 1: Frontend Hooks (30 min)

| File | Change |
|------|--------|
| `src/features/reservation/hooks/use-profile.ts` | **COMPLETE REWRITE** - Removed placeholder implementations |
| `src/features/reservation/hooks/use-profile.ts` | Wired `useProfile` to `trpc.profile.me.queryOptions()` |
| `src/features/reservation/hooks/use-profile.ts` | Wired `useUpdateProfile` to `trpc.profile.update.mutationOptions()` |
| `src/features/reservation/hooks/use-profile.ts` | Added success/error toast notifications |
| `src/features/reservation/hooks/use-profile.ts` | Added query cache invalidation on success |

### Phase 2: Backend Validation (30 min)

| File | Change |
|------|--------|
| `src/modules/profile/errors/profile.errors.ts` | Created `IncompleteProfileError` class extending `ValidationError` |
| `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts` | Added profile completeness validation before reservation |
| `src/modules/reservation/use-cases/create-free-reservation.use-case.ts` | Added profile completeness validation before reservation |
| `src/modules/reservation/reservation.router.ts` | Added `IncompleteProfileError` handling in error mapper |

### Phase 3: UI Polish (15 min)

| File | Change |
|------|--------|
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Fixed completeness check: email OR phone (not both required) |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Fixed profile mapping for ProfilePreviewCard (phoneNumber → phone) |
| `src/features/reservation/components/profile-form.tsx` | Fixed null → undefined type conversions for AvatarUpload |

## Key Decisions

- **Profile completeness logic**: `displayName + (email OR phone)` - flexible but ensures one contact method
- **Backend validation**: Added to use-cases to prevent API bypass and ensure data quality
- **Error handling**: `IncompleteProfileError` extends `ValidationError` (400 status)
- **Avatar upload**: Deferred (button visible but non-functional) - not blocking for MVP

## Profile Completeness Validation

Both frontend and backend now use consistent logic:

```typescript
// Required: displayName + at least one contact method
const isComplete = 
  !!profile?.displayName && 
  (!!profile?.email || !!profile?.phoneNumber);
```

**Valid profiles:**
- ✅ displayName + email
- ✅ displayName + phone
- ✅ displayName + email + phone

**Invalid profiles (blocked):**
- ❌ displayName only (no contact)
- ❌ email/phone only (no name)
- ❌ Empty profile

## Implementation Details

### useProfile Hook (Before → After)

**Before (Broken):**
```typescript
export function useProfile() {
  return useQuery({
    queryFn: async () => null as Profile | null,  // Always null!
  });
}
```

**After (Working):**
```typescript
export function useProfile() {
  const trpc = useTRPC();
  return useQuery(trpc.profile.me.queryOptions());  // Real backend call
}
```

### Backend Validation

Added to both paid and free reservation use cases:

```typescript
// After profile fetch
if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
  throw new IncompleteProfileError();
}
```

### Error Response

When validation fails, API returns:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Please complete your profile before booking. A display name and at least one contact method (email or phone) is required."
  }
}
```

## Testing Results

```bash
✓ TypeScript compilation: No errors
✓ Build successful: pnpm build
✓ All routes compiled successfully
✓ Profile page functional (loads and saves)
✓ Booking flow unblocked
```

## Files Modified Summary

**Frontend (3 files):**
- `src/features/reservation/hooks/use-profile.ts` - Core fix
- `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` - Completeness check
- `src/features/reservation/components/profile-form.tsx` - Type fixes

**Backend (4 files):**
- `src/modules/profile/errors/profile.errors.ts` - New error class
- `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts` - Validation
- `src/modules/reservation/use-cases/create-free-reservation.use-case.ts` - Validation
- `src/modules/reservation/reservation.router.ts` - Error handling

## User Stories Documented

Created comprehensive user stories in `agent-plans/user-stories/09-client-profile/`:

| Story | Description |
|-------|-------------|
| US-09-01 | Player Views Profile |
| US-09-02 | Player Updates Profile |
| US-09-03 | Profile Completeness for Booking |

## Implementation Plans Created

Created detailed plans in `agent-plans/09-client-profile/`:

| Plan | Description |
|------|-------------|
| 09-00-overview.md | Master implementation plan |
| 09-01-frontend-hooks.md | Phase 1: Wire hooks to tRPC |
| 09-02-backend-validation.md | Phase 2: Backend validation guards |
| 09-03-ui-polish.md | Phase 3: UI improvements |

## Success Criteria Met

- [x] Profile page loads real data
- [x] Profile updates work and persist
- [x] Backend validates profile completeness
- [x] Booking flow works with complete profiles
- [x] Clear error messages for incomplete profiles
- [x] Build passes with no TypeScript errors
- [x] Frontend and backend validation consistent

## Impact

### Before Fix
- ❌ Profile page broken (always showed loading/null)
- ❌ Profile updates always failed
- ❌ Booking flow completely blocked
- ❌ No backend validation (data quality issues)

### After Fix
- ✅ Profile page fully functional
- ✅ Profile updates work with success feedback
- ✅ Booking flow unblocked for complete profiles
- ✅ Backend enforces profile completeness
- ✅ Clear user guidance for incomplete profiles

## Next Steps

Deferred enhancements (not blocking):

- [ ] Implement avatar upload functionality
- [ ] Add profile completeness indicator on profile page
- [ ] Add unsaved changes warning on navigation
- [ ] Add profile edit history/audit log

## Commands to Continue

```bash
# Test profile functionality
# 1. Navigate to /account/profile
# 2. Fill displayName + email or phone
# 3. Save changes
# 4. Navigate to /courts/[id]/book/[slotId]
# 5. Verify Reserve button is enabled
```

## Technical Notes

- **Error class hierarchy**: `IncompleteProfileError` extends `ValidationError` (HTTP 400)
- **Type conversions**: Backend uses `null` for empty values, frontend expects `undefined`
- **Validation location**: Both use-cases (paid and free reservations) have identical validation
- **Cache strategy**: Profile queries invalidated on update for immediate UI refresh
- **Profile auto-creation**: Backend auto-creates profile on first access via `getOrCreateProfile()`
