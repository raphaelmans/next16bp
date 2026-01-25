# Import Bookings Path

Goal: prevent double booking by blocking existing booked times from external systems.

## Current State

- Owners can upload a bookings file.
- Upload creates an import job in DRAFT state.
- Upload redirects to a review page (`/owner/import/bookings/[jobId]`).
- Owners can normalize the file, review/edit rows, then commit blocks.
- Screenshot/image imports are not implemented yet (currently produce 0 rows).

## Ongoing Development Notes

- Import MVP is complete end-to-end (normalize + review/edit + commit) and safe enough for onboarding UX.
- Reference: `agent-contexts/01-12-bookings-import-mvp-complete.md`

Deferred items (do not assume these exist in onboarding):
- List/resume jobs per venue on the upload page.
- Screenshot/image extraction for `sourceType=image`.

## Revamp UX Placement

Place import on the owner setup hub as an optional card.

Prerequisite:
- a venue must exist (created or claimed).

Copy requirements:
- Be explicit that availability is only blocked after commit.
- Be explicit that normalization supports deterministic parsing for `ics/csv/xlsx` today; image extraction is pending.

## Before vs After

BEFORE

```text
/owner/import/bookings
  -> upload
  -> redirect to review
```

AFTER

```text
/owner/get-started
  -> Import bookings (optional)
     - if no venue: prompt to add/claim first
     - upload file (job=DRAFT)
     - redirect to /owner/import/bookings/:jobId
     - normalize (deterministic or AI one-time)
     - review + fix rows
     - commit (creates court blocks)
```

## Commit Semantics (What owners should expect)

- Commit creates `court_block` records (type=MAINTENANCE) to remove availability for the imported time ranges.
- Commit runs overlap checks at commit time:
  - existing `court_block` overlaps -> row is skipped
  - existing reservation overlaps -> row is skipped
- Commit is best-effort:
  - some rows can commit while others are skipped
  - retries are safe-ish: already committed rows are not duplicated
