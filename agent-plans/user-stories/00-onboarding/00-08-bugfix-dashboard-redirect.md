# Bug Fix: Legacy Dashboard Redirect

**Status:** ✅ Fixed  
**Priority:** High  
**Discovered:** 2026-01-07  
**Fixed:** 2026-01-07  
**Related User Story:** US-00-07 (Home Page for Authenticated Users)

---

## Problem Description

### Current State

1. Legacy dashboard exists at `/dashboard` (protected route)
2. Some login flows may still redirect to `/dashboard` instead of `/home`
3. Creates confusion - two "home" pages for authenticated users
4. Inconsistent with new UX design (US-00-07)

### Expected State

1. All authenticated users land on `/home` after login
2. `/dashboard` should redirect to `/home`
3. Single source of truth for authenticated user landing page

---

## Impact

- **Users:** May land on outdated dashboard page
- **Developers:** Confusion about which page is canonical
- **Maintenance:** Two pages serving similar purpose

---

## Root Cause

Legacy boilerplate code that predates KudosCourts UX design. The `/dashboard` route was the original protected page example.

---

## Solution

### Option A: Redirect `/dashboard` to `/home` (RECOMMENDED)

**Pros:**
- Backward compatible (any bookmarks/links still work)
- Clean migration path
- No broken links

**Cons:**
- Keeps the file around

### Option B: Delete `/dashboard` entirely

**Pros:**
- Cleaner codebase

**Cons:**
- Breaks any existing bookmarks/links
- May cause 404s during transition

**Decision:** Use Option A for safety.

---

## Implementation Plan

### Step 1: Create Redirect

- [x] Update `/src/app/(protected)/dashboard/page.tsx` to redirect to `/home`
- [x] Use `redirect()` from `next/navigation`
- [x] Server-side redirect (instant, no flash)

### Step 2: Verify Login Flows

- [x] Check `/src/features/auth/components/login-form.tsx` - already redirects to `/home`
- [x] Update `src/app/auth/confirm/route.ts` - magic link/signup redirects
- [x] Update `src/proxy.ts` - changed protected route from `/dashboard` to `/home`
- [x] Fix `src/features/discovery/components/footer.tsx` - owner dashboard link

### Step 3: Update Documentation

- [x] Document fix in this file

---

## Testing Checklist

- [x] Visit `/dashboard` while authenticated → redirects to `/home`
- [x] Visit `/dashboard` while unauthenticated → redirects to login, then `/home`
- [x] Login flow → `/home` (not `/dashboard`)
- [x] No console errors
- [x] No infinite redirect loops
- [x] Build passes (`npm run build`)

---

## Future Cleanup

After 1-2 sprints of `/dashboard` → `/home` redirect being live:
- [ ] Consider removing `/dashboard` entirely
- [ ] Search codebase for any `/dashboard` references
- [ ] Remove the redirect file if no longer needed

---

## Files Modified

1. ✅ `src/app/(protected)/dashboard/page.tsx` - Now redirects to `/home` using `redirect()`
2. ✅ `src/proxy.ts` - Changed protected route from `/dashboard` to `/home`
3. ✅ `src/app/auth/confirm/route.ts` - Changed magic link/signup/recovery redirects to `/home`
4. ✅ `src/features/discovery/components/footer.tsx` - Fixed owner dashboard link from `/owner/dashboard` to `/owner`

---

## Acceptance Criteria

**Given** a user navigates to `/dashboard`  
**When** they are authenticated  
**Then** they are immediately redirected to `/home`

**Given** a user navigates to `/dashboard`  
**When** they are not authenticated  
**Then** they are redirected to login, and after login redirected to `/home`

**Given** a user logs in  
**When** no explicit redirect is specified  
**Then** they land on `/home` (not `/dashboard`)
