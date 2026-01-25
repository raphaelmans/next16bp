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
- Post-create behavior (locked): redirect to `/owner/verify/:placeId`

Card 2B: Claim existing listing (optional)
- CTA: "Claim listing"
- Completion: claim request submitted
- State: pending admin review

Card 3: Import existing bookings (optional)
- Prerequisite: venue exists
- CTA: "Upload bookings file"
- Current state: upload redirects to a review page where owners can normalize, review/edit rows, then commit blocks.
- Remaining limitation: screenshot/image imports currently do not extract rows (0 rows) until AI extraction is implemented.
- Deferred: list/resume jobs per venue on the upload page.

Card 4: Go-live checklist
- Shows what makes a venue "bookable":
  - verified status
  - reservations enabled
  - at least one active court
  - schedule + pricing configured
  - no blocking conflicts (imports/blocks)

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
  -> Import (optional)
  -> Verify (if venue exists)
  -> Next actions checklist
```
