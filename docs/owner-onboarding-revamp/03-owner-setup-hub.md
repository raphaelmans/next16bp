# Owner Setup Hub: /owner/get-started

This is the first protected destination for owners after signup/login.

## Purpose

- Provide a single place to complete owner setup without bouncing between unrelated pages.
- Make prerequisites explicit.

## Layout

Pattern: bento checklist + progress indicator.

Guidelines:
- Show progress ("Step X of Y" or a progress bar).
- Allow skipping optional steps.
- One primary CTA per state.

## Core Cards (Proposed)

Card 1: Create organization (required)
- CTA: "Create organization"
- Completion: org exists

Card 2A: Add new venue (optional)
- CTA: "Add venue"
- Completion: place created
- Post-create behavior (updated): redirect back to `/owner/get-started` (verification becomes an explicit next step)

Card 2B: Claim existing listing (optional)
- CTA: "Claim listing"
- Completion: claim request submitted
- State: pending admin review

Card 3: Get your venue verified
- Prerequisite: venue exists
- CTA: "Submit verification"
- Completion: verification request submitted (PENDING) or status is VERIFIED

Card 4: Go live

Card 4A: Configure venue courts
- Prerequisite: venue exists
- CTA: "Set up courts"
- Completion: at least one active court exists (schedule/pricing can be configured in the setup wizard)

Card 4B: Import existing bookings (optional)
- Prerequisite: venue exists
- CTA: "Upload bookings file"
- Current state: upload redirects to a review page where owners can normalize, review/edit rows, then commit blocks.
- Remaining limitation: screenshot/image imports currently do not extract rows (0 rows) until AI extraction is implemented.
- Deferred: list/resume jobs per venue on the upload page.

## Before vs After

BEFORE

```text
Owner must discover setup across:
  /owner/onboarding
  /owner/venues/new
  /owner/venues/:placeId/courts/*
  /owner/verify/:placeId
  /owner/import/bookings
```

AFTER

```text
/owner/get-started
  -> Org (required)
  -> Venue: Add OR Claim (optional)
  -> Verify (if venue exists)
  -> Go Live:
       - Configure courts
       - Import bookings (optional)
```
