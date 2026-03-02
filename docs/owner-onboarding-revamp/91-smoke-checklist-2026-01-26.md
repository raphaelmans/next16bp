# Owner Onboarding Revamp - Smoke Testing Checklist (2026-01-26)

Audience: Product + QA + Ops

Goal: validate the owner onboarding funnel end-to-end across key paths without needing deep technical knowledge.

## Preconditions

- Environment: staging or production preview
- Test accounts:
  - Player-only user (no organization)
  - New owner user (no organization yet)
  - Existing owner user (has organization)
- Optional test data:
  - A curated, unclaimed venue listing to test claim flow
  - A small ICS/CSV/XLSX file with 2-5 bookings for import flow

## URLs Under Test

- `/owners/get-started` (public, indexable)
- `/list-your-venue` (legacy redirect)
- `/register` (general)
- `/register/owner` (owner-specific)
- `/login`
- `/post-login` (server-side router)
- `/owner/get-started` (setup hub)

## Test Matrix

### A) Public landing + redirect

- [ ] Visit `/owners/get-started` while logged out
  - [ ] Page loads and shows owner-focused messaging and CTA
  - [ ] Primary CTA goes to owner registration
- [ ] Visit `/list-your-venue` while logged out
  - [ ] Redirects to `/owners/get-started`

### B) Registration flows

- [ ] Visit `/register/owner` while logged out
  - [ ] Page copy is owner-focused
  - [ ] Complete signup
  - [ ] After signup you land on `/owner/get-started`

- [ ] Visit `/register` with no `redirect` param
  - [ ] Role chooser is shown (Player vs Owner)
  - [ ] Choose Player -> signup -> lands in player flow (via `/post-login` -> `/home`)
  - [ ] Choose Owner -> routes to `/register/owner?redirect=/owner/get-started`

- [ ] Visit `/register?redirect=/owner/get-started`
  - [ ] Role chooser is NOT shown
  - [ ] Signup -> lands on `/owner/get-started`

### C) Login + post-login routing

- [ ] Login as player-only user with NO redirect param
  - [ ] Lands on `/home`

- [ ] Login as existing owner (has organization) with NO redirect param
  - [ ] Lands on `/owner`

- [ ] Login as new user who previously set owner intent but has NO org
  - [ ] Lands on `/owner/get-started`

- [ ] Explicit redirect always wins
  - [ ] Open `/login?redirect=/courts` -> login -> lands on `/courts`
  - [ ] Open `/login?redirect=/owner/import/bookings` -> login -> lands on `/owner/import/bookings`

### D) Owner setup hub

- [ ] Visit `/owner/get-started` as logged-in user with NO organization
  - [ ] Page loads (should not be blocked by owner org gate)
  - [ ] Create organization succeeds
  - [ ] Organization step shows completed state

- [ ] Add venue (setup-hub path)
  - [ ] From `/owner/get-started` click Add venue
  - [ ] Confirm URL includes `from=setup`
  - [ ] Create venue succeeds
  - [ ] Redirects to `/owner/verify/:placeId`

- [ ] Add venue (existing owner dashboard path)
  - [ ] From `/owner/venues/new` create venue
  - [ ] Redirects to first-court creation (existing behavior)

### E) Claim existing listing

- [ ] From `/owner/get-started`, open Claim listing
  - [ ] Search works (requires at least 2 chars)
  - [ ] Submit claim on a curated/unclaimed venue
  - [ ] Success toast appears
  - [ ] Hub shows pending state

### F) Import bookings

- [ ] From `/owner/get-started`, click Start import
  - [ ] Lands on `/owner/import/bookings`

- [ ] Import flow (ICS/CSV/XLSX)
  - [ ] Upload file -> redirected to `/owner/import/bookings/:jobId`
  - [ ] Normalize -> rows appear
  - [ ] Commit -> completion shown; availability is blocked (if courts/schedule exist)

- [ ] Verify limitation
  - [ ] Attempt `image`/screenshot import -> results in 0 rows (expected until implemented)

## Ops / Environment Validation

- [ ] Confirm DB migration for user preferences is applied in this environment
  - Table: `user_preferences`
  - Column: `default_portal` (player/organization)

## Pass/Fail Criteria

- PASS if all A–D pass and at least one of E or F passes.
- FAIL if:
  - `/list-your-venue` does not redirect
  - `/post-login` misroutes users without explicit redirect
  - `/owner/get-started` is inaccessible to a new owner without an organization
  - Setup hub add-venue does not redirect to verification
