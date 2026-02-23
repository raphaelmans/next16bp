# Spec: inline-profile-setup-modal

## Purpose

Allow a player to complete their profile without leaving the booking page.

## Actors

- **Authenticated Player** with incomplete profile

## Preconditions

- Player is on PlaceBookingPage
- `isProfileComplete` is false (`!profile.displayName || (!profile.email && !profile.phoneNumber)`)

## Behaviour

### IPM-01 Banner shown when profile incomplete

GIVEN profile is incomplete
WHEN PlaceBookingPage renders
THEN a non-blocking banner MUST appear above the booking detail grid
AND banner MUST contain a "Complete Profile" CTA

### IPM-02 OrderSummary overlayed when profile incomplete

GIVEN profile is incomplete
WHEN PlaceBookingPage renders
THEN the OrderSummary section MUST render with a visual overlay
AND the overlay MUST contain a "Set up your profile to confirm" CTA
AND the confirm button MUST be disabled (via existing `disabled={!isProfileComplete}`)

### IPM-03 Modal opens from banner or overlay CTA

GIVEN profile is incomplete
WHEN the user clicks "Complete Profile" (banner) or "Set up your profile to confirm" (overlay)
THEN `ProfileSetupModal` MUST open as a shadcn/ui Dialog
AND focus MUST move into the modal

### IPM-04 Modal form fields

GIVEN ProfileSetupModal is open
THEN it MUST contain fields for: displayName (required), phoneNumber (optional), email (optional)
AND it MUST validate that displayName is non-empty before enabling submit

### IPM-05 Successful submit dismisses modal and refreshes state

GIVEN the user submits valid profile data
WHEN `useMutUpdateProfile` resolves
THEN the profile query MUST be invalidated (via hook's built-in onSuccess)
AND the modal MUST close
AND `isProfileComplete` MUST re-evaluate to true
AND the banner and overlay MUST disappear
AND the OrderSummary MUST become fully interactive

### IPM-06 Modal can be dismissed without submitting

GIVEN ProfileSetupModal is open
WHEN the user presses Escape or clicks outside
THEN the modal MUST close
AND no profile mutation MUST occur
AND the booking state MUST remain unchanged

### IPM-07 No page navigation on profile save

GIVEN profile is saved via the modal
THEN the router MUST NOT navigate away from the booking page
AND booking nuqs params MUST be preserved
