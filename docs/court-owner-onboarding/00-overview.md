# Court Owner Onboarding (Current State)

Goal of this doc set: capture the current (as-built) owner-facing onboarding + setup flow so we can safely redesign UX without guessing.

Terminology used in code:
- Organization: the owner entity (1 org per user currently).
- Venue: a `place` record (routes use `/owner/venues/*`; some code files still live under `.../places/...`).
- Court: a `court` record under a venue.

## Current End-to-End Flow

```text
[Public] /list-your-venue
   |
   | sets localStorage: kudos.owner_onboarding=true
   v
[Auth] /login  ->  /home
   |
   | if onboarding intent && user has no org => redirect
   v
[Protected] /owner/onboarding
   |
   | trpc.organization.create
   v
[Owner] /owner/venues/new
   |
   | trpc.placeManagement.create   (placeType=RESERVABLE, claimStatus=CLAIMED)
   v
[Owner] /owner/venues/:placeId/courts/new
   |
   | trpc.courtManagement.create
   v
[Owner] /owner/verify/:placeId
   |
   | trpc.placeVerification.submit
   | (admin review happens off-platform)
   v
[Owner] /owner/verify/:placeId
   |
   | if VERIFIED => owner toggles reservations on
   | trpc.placeVerification.toggleReservations
   v
[Owner] Court ops (per court)
   |
   | schedule/pricing: /owner/venues/:placeId/courts/:courtId/schedule
   | availability:     /owner/venues/:placeId/courts/:courtId/availability
   | imports:          /owner/import/bookings
   v
(Ongoing operations)
```

Important gating behavior:
- Owner routes (`src/app/(owner)/*`) require a session and at least 1 organization; otherwise redirect to `/owner/onboarding`.
- Availability results are empty unless the venue is `VERIFIED` and `reservationsEnabled=true`.
- Magic link + signup confirmation preserve intended destination via `redirect` on `/auth/confirm` (templates in `supabase/templates/*` append `token_hash` + `type` to `{{ .RedirectTo }}`).

## Module Docs

Each module doc includes a small ASCII diagram + the concrete routes, tRPC procedures, and tables involved.

1. Organization creation: `docs/court-owner-onboarding/01-organization.md`
2. Venue creation: `docs/court-owner-onboarding/02-venue.md`
3. Court creation: `docs/court-owner-onboarding/03-courts.md`
4. Court setup (schedule + pricing): `docs/court-owner-onboarding/04-court-setup-schedule-pricing.md`
5. Availability management (including blocks): `docs/court-owner-onboarding/05-availability.md`
6. Importing external bookings to block availability: `docs/court-owner-onboarding/06-bookings-import.md`

## Key UX Notes (Current)

- The marketing/onboarding path is “4 steps” (org, venue, first court, verification). Schedule/pricing is explicitly positioned as “later” on `/list-your-venue`.
- The legacy “publish slots / manage slots” concept is being replaced by schedule-derived availability (see `agent-plans/65-rules-exceptions-cutover/65-00-overview.md`). Several `/slots` routes now redirect to availability.
- Bookings import now supports an end-to-end flow (upload -> normalize -> review/edit -> commit) under `/owner/import/bookings` and `/owner/import/bookings/[jobId]`. Screenshot/image extraction is still not implemented (currently yields 0 rows).

Recent related work:
- Bookings import MVP is complete (upload -> review -> normalize -> edit -> commit -> discard). See `agent-contexts/01-12-bookings-import-mvp-complete.md` and `agent-plans/71-bookings-import-review-commit/71-00-overview.md`.
- Deferred import items: list/resume jobs per venue (upload page) and screenshot/image extraction for `sourceType=image`.
