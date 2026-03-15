# Phase 4: Owner Setup Hub (/owner/get-started)

**Dependencies:** Auth entrypoints exist (recommended), org/place/claim/import APIs already exist
**Parallelizable:** Partial

## Objective

Create a single protected hub where a new owner can:
- create an organization
- optionally add a new venue (then go to verification)
- optionally claim an existing curated listing
- optionally start importing bookings

Critical: this route must be accessible before an organization exists.

---

## Shared / Contract

- Route: `/owner/get-started` (protected)
- Card contract:
  - each card has a single primary CTA and a clear prerequisite state
- Import truth:
  - ICS/CSV/XLSX deterministic parsing works
  - image extraction is deferred (0 rows today)

---

## Server / Backend

- [ ] N/A (hub can call existing tRPC endpoints)

Optional enhancements (can be deferred):
- [ ] Add a server-side use case to create organization + venue in one transaction.
- [ ] Add a dedicated endpoint to set `defaultPortal=owner` (if not handled by org creation).

---

## Client / Frontend

### Route placement

To avoid the owner layout org gate, place the page under the `(auth)` group:
- `src/app/(auth)/owner/get-started/page.tsx` -> `/owner/get-started`

### UI Layout (ASCII)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Owner Setup                                                             │
│ Stepper: 1) Org  2) Venue  3) Verify  4) Go live                         │
├───────────────────────────────────────────────┬──────────────────────────┤
│ Setup cards (bento)                           │ Status / Help            │
│ ┌──────────────────────────────┐              │ - What is verification?  │
│ │ 1. Create organization (req)  │              │ - Import limitations      │
│ │ [Create org]                  │              │ - Contact support         │
│ └──────────────────────────────┘              │                          │
│ ┌──────────────────────────────┐              │                          │
│ │ 2A. Add new venue (opt)       │              │                          │
│ │ [Add venue]                   │              │                          │
│ └──────────────────────────────┘              │                          │
│ ┌──────────────────────────────┐              │                          │
│ │ 2B. Claim existing listing    │              │                          │
│ │ [Find listing] [Submit claim] │              │                          │
│ └──────────────────────────────┘              │                          │
│ ┌──────────────────────────────┐              │                          │
│ │ 3. Import bookings (opt)      │              │                          │
│ │ [Start import]                │              │                          │
│ └──────────────────────────────┘              │                          │
└───────────────────────────────────────────────┴──────────────────────────┘
```

### Card details

Update (2026-01-27): this plan reflects the first hub iteration. The next iteration (Stepper v2) changes the hub card order and makes verification explicit on the hub (venue creation from the hub returns to `/owner/get-started`).

See:
- `docs/owner-onboarding-revamp/92-stepper-v2-change-2026-01-27.md`
- `agent-plans/73-owner-setup-hub-stepper-v2/73-00-overview.md`

Card 1: Create organization (required)
- Uses `trpc.organization.create`.
- On success:
  - mark card complete
  - set default portal to owner (depends on Phase 5 implementation)

Card 2A: Add new venue (optional)
- Uses `trpc.placeManagement.create`.
- Post-create behavior (locked): redirect to `/owner/verify/:placeId`.

Implementation note:
- The hub uses a query param to preserve the existing venue flow:
  - `/owner/get-started` -> `/owner/places/new?from=setup`
  - Venue create success redirects to `/owner/verify/:placeId` when `from=setup`.
  - Default venue create flow remains unchanged (first-court creation).

Card 2B: Claim existing listing (optional)
- Discovery:
  - query `trpc.place.list` with `verificationTier="curated"` + search `q`
  - filter to unclaimed entries
- Action:
  - `trpc.claimRequest.submitClaim({ placeId, organizationId, requestNotes? })`
- Status:
  - `trpc.claimRequest.getMy` to show pending/approved/rejected (at least pending)

Card 3: Import bookings (optional)
- Link to existing import page: `/owner/import/bookings`.
- Copy:
  - "Blocks availability only after commit"
  - "Screenshots not supported yet"

---

## Acceptance Criteria

- [ ] A signed-in user with no org can load `/owner/get-started`.
- [ ] Owner can create an org from the hub.
- [ ] Owner can create a venue and is redirected to verification.
- [ ] Owner can submit a claim request for a curated listing from the hub.
- [ ] Owner can start the bookings import flow (routes into existing pages).
