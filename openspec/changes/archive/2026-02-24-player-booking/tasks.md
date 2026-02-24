# Tasks: player-booking

## T-01 Fix BookingCard redirect URL [discovery feature] ✅

**File:** `src/features/discovery/components/booking-card.tsx`

- Changed `handleReserveClick` unauthenticated branch to use full booking URL
  `/courts/${courtId}/book/${selectedSlot.id}` as redirect
- Writes localStorage entry `kudos:pending-booking` via `savePendingBooking` before routing
- Updated sign-in / create-account `<Link>` hrefs similarly to use full booking URL

---

## T-02 Create `usePendingBooking` hook [reservation feature] ✅

**File:** NEW `src/features/reservation/hooks/use-pending-booking.ts`

- `savePendingBooking` writes `{ courtId, slotId, startTime, expires }` with 30-min TTL
- `clearPendingBooking` removes the key
- `readPendingBooking` validates TTL + courtId match
- `usePendingBooking(courtId)` — TQ hook with `initialData` reading from localStorage;
  `staleTime: Infinity`, `gcTime: 0`

---

## T-03 Seed nuqs state from pending booking on PlaceBookingPage [reservation feature] ✅

**File:** `src/features/reservation/pages/place-booking-page.tsx`

- Calls `usePendingBooking(placeIdOrSlug)` — `placeIdOrSlug` equals courtId in court flow
- `useEffect` seeds `startTime` nuqs param from localStorage if absent
- `clearPendingBooking()` called inside `handleConfirm` after successful mutation

---

## T-04 Create `ProfileSetupModal` component [reservation feature] ✅

**File:** NEW `src/features/reservation/components/profile-setup-modal.tsx`

- shadcn/ui `<Dialog>` controlled by `open` + `onOpenChange` props
- Fields: `displayName` (required), `phoneNumber` (optional), `email` (optional)
- Uses `S.profile.*` + `S.common.email` schemas from `@/common/schemas`
- On submit: `useMutUpdateProfile().mutateAsync(data)` → `utils.profile.me.invalidate()` (via
  hook's built-in onSuccess) → close via `onOpenChange(false)`

---

## T-05 Add `ProfileIncompleteBanner` and overlay to PlaceBookingPage [reservation feature] ✅

**File:** `src/features/reservation/pages/place-booking-page.tsx`

- Added `showProfileModal` useState
- When `!isProfileComplete`: renders inline banner above grid with "Complete Profile" CTA
- `OrderSummary` wrapped in `relative` container; absolute overlay shown when `!isProfileComplete`
- `<ProfileSetupModal>` rendered at page level

---

## T-06 Update `ProfilePreviewCard` to support modal trigger [reservation feature] ✅

**File:** `src/features/reservation/components/profile-preview-card.tsx`

- Added optional `onEditClick?: () => void` prop
- When `onEditClick` provided: "Edit" button calls it instead of `<Link>`
- Existing link behaviour preserved when `onEditClick` is absent (backwards-compatible)
- `PlaceBookingPage` passes `onEditClick={() => setShowProfileModal(true)}`

---

## T-07 Verify `getSafeRedirectPath` allows booking URL [auth / common] ✅

**File:** `src/common/redirects.ts` (read-verify, no change)

- `getSafeRedirectPath` called with `disallowRoutes: ["guest"]` in `auth/callback/route.ts`
- `/courts/{id}/book/{slotId}` maps to route type "booking" (not "guest") via `bookingRoutePattern`
- No code change needed — confirmed safe
