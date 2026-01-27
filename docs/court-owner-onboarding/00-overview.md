# Court Owner Onboarding (As-Built + Planned Updates)

Goal of this doc set: capture the current (as-built) owner-facing onboarding + setup flow so we can safely redesign UX without guessing.

Terminology used in code:
- Organization: the owner entity (1 org per user currently).
- Venue: a `place` record (routes use `/owner/venues/*`; some code files still live under `.../places/...`).
- Court: a `court` record under a venue.

## Current End-to-End Flow

```text
[Public] /owners/get-started
   |
   | CTA -> /register/owner?redirect=/owner/get-started
   v
[Protected] /owner/get-started  (setup hub)
   |
   | Create organization (trpc.organization.create)
   | Add venue OR claim listing
   v
[Owner] /owner/venues/new?from=setup
   |
   | trpc.placeManagement.create (placeType=RESERVABLE, claimStatus=CLAIMED)
   v
[Owner] /owner/verify/:placeId  (current behavior when from=setup)
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
   | courts setup:      /owner/venues/:placeId/courts/setup
   | schedule/pricing:  /owner/venues/:placeId/courts/:courtId/schedule
   | availability:      /owner/venues/:placeId/courts/:courtId/availability
   | imports:           /owner/import/bookings
   v
(Ongoing operations)
```

Legacy / compatibility notes:
- `/list-your-venue` is now a permanent redirect to `/owners/get-started`.
- `/owner/onboarding` still exists as an org-gated fallback when a user hits owner routes without an organization.

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

- The marketing page (`/owners/get-started`) frames onboarding as 3 steps (account, venue, verification). The setup hub (`/owner/get-started`) uses a 4-step checklist (org, venue, verify, go live).
- The legacy “publish slots / manage slots” concept is being replaced by schedule-derived availability (see `agent-plans/65-rules-exceptions-cutover/65-00-overview.md`). Several `/slots` routes now redirect to availability.
- Bookings import now supports an end-to-end flow (upload -> normalize -> review/edit -> commit) under `/owner/import/bookings` and `/owner/import/bookings/[jobId]`. Screenshot/image extraction is still not implemented (currently yields 0 rows).

## Planned Update: Hub-Centric Stepper (Pending Implementation)

Change request summary:

```text
Goal: every setup step returns to /owner/get-started

Cards / steps on /owner/get-started:
  1) Create organization
  2) Venue added OR claim existing listing
     2a) Add new venue
     2b) Claim existing listing
  3) Get your venue verified
  4) Go live
     4a) Configure venue courts
     4b) Import bookings

Key redirect change:
  /owner/venues/new?from=setup
    - today: redirects to /owner/verify/:placeId
    - desired: redirects back to /owner/get-started (unlocking step 3 as an explicit card)
```

Recent related work:
- Bookings import MVP is complete (upload -> review -> normalize -> edit -> commit -> discard). See `agent-contexts/01-12-bookings-import-mvp-complete.md` and `agent-plans/71-bookings-import-review-commit/71-00-overview.md`.
- Deferred import items: list/resume jobs per venue (upload page) and screenshot/image extraction for `sourceType=image`.
