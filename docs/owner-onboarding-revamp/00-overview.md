# Owner Onboarding Revamp (Spec)

This folder captures the agreed UX direction for a revamped court-owner onboarding flow.

Do not implement yet. This is documentation only.

## Goals

- Owners land in the Owner Portal by default (without breaking player-first booking flows).
- Owners can complete the minimum setup in one coherent flow: organization + (optional) venue + (optional) import + verify.
- Marketing has a single canonical link to drive conversions.
- The system makes "why am I not bookable?" explicit.

## Key Decisions (Locked)

- Public canonical marketing page: `/owners/get-started`.
- Legacy URL `/list-your-venue` becomes a permanent redirect to `/owners/get-started`.
- Protected setup hub: `/owner/get-started`.
- Auth entry points:
  - `/register/owner` (owner-specific copy, no role chooser, defaults redirect to `/owner/get-started`).
  - `/register` (general; shows Player vs Owner chooser only when intent is unknown).
- Transfer/Claim is a first-class path in owner onboarding (no new concierge feature; use existing Transfer/Claim mechanics).

## Design System Constraints

Use the existing KudosCourts design system:
- Minimalist bento layout, warm neutrals, teal primary CTA, orange accents.
- One strong primary CTA per screen.

Reference: `business-contexts/kudoscourts-design-system.md`

## Before vs After (End-to-End)

BEFORE

```text
/list-your-venue
  -> /login?redirect=/owner/onboarding
  -> /home (often)
  -> /owner/onboarding (create org)
  -> /owner/venues/new (create venue)
  -> /owner/venues/:placeId/courts/new (create court)
  -> /owner/verify/:placeId (submit docs)
  -> (admin review)
  -> /owner/verify/:placeId (toggle reservations on)
  -> /owner/venues/:placeId/courts/:courtId/schedule
  -> /owner/venues/:placeId/courts/:courtId/availability
  -> /owner/import/bookings (upload -> review -> normalize -> commit)
```

AFTER

```text
/owners/get-started (public)
  -> CTA: /register/owner?redirect=/owner/get-started
  -> /owner/get-started (protected hub)
       - Create organization (required)
       - Add new venue (optional) OR Claim existing listing (optional)
       - Import bookings (optional; requires venue)
       - Continue to verification if venue created

/list-your-venue
  -> permanent redirect to /owners/get-started
```

## Note: Platform has moved forward

Bookings import is no longer "upload only": it now has review/edit + normalization + commit in the owner UI.
Bookings import MVP is considered complete (see `agent-contexts/01-12-bookings-import-mvp-complete.md`).

Deferred import items (do not depend on these for onboarding UX):
- List/resume jobs per venue (upload page).
- Screenshot/image extraction for `sourceType=image`.

## Docs Index

- Public marketing page: `docs/owner-onboarding-revamp/01-public-marketing-page.md`
- Auth entry points: `docs/owner-onboarding-revamp/02-auth-entrypoints.md`
- Owner setup hub: `docs/owner-onboarding-revamp/03-owner-setup-hub.md`
- Default portal routing: `docs/owner-onboarding-revamp/04-default-portal-routing.md`
- Transfer/claim path: `docs/owner-onboarding-revamp/05-transfer-claim-path.md`
- Import path: `docs/owner-onboarding-revamp/06-import-bookings-path.md`
- SEO + copy guardrails: `docs/owner-onboarding-revamp/07-seo-and-copy.md`
- Open questions: `docs/owner-onboarding-revamp/99-open-questions.md`
