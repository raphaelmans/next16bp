# Owner Onboarding Revamp - Master Plan

## Overview

Convert the owner onboarding experience into a single coherent funnel:

- Public marketing entry: `/owners/get-started` (SEO-indexable)
- Owner-specific auth entry: `/register/owner` (owner copy, no role chooser)
- Protected setup hub: `/owner/get-started` (create org + add/claim venue + import + next actions)
- Default portal routing: owners land in `/owner` by default after login (when no explicit `redirect` param)
- Deprecate legacy marketing URL: `/list-your-venue` becomes a permanent redirect to `/owners/get-started`

This plan is implementation-focused and meant to be delegated.

## Reference Documents

| Document | Path | Purpose |
|----------|------|---------|
| Product spec (this epic) | `docs/owner-onboarding-revamp/` | UX decisions, copy/SEO guardrails |
| Current owner onboarding (as-built) | `docs/court-owner-onboarding/00-overview.md` | Baseline current behavior |
| Import flow (as-built) | `docs/court-owner-onboarding/06-bookings-import.md` | Import is MVP-complete; image extraction deferred |
| Design System | `business-contexts/kudoscourts-design-system.md` | Colors/typography/layout direction |
| Place claiming | `agent-plans/user-stories/17-place-claiming/` | Transfer/claim story background |
| Place verification | `agent-plans/user-stories/19-place-verification/` | Verification gating |
| Bookings import epic | `agent-plans/user-stories/66-bookings-import/` | Import requirements |
| Import MVP completion log | `agent-contexts/01-12-bookings-import-mvp-complete.md` | What is already shipped |

## Before vs After

BEFORE

```text
/list-your-venue
  -> /login?redirect=/owner/onboarding
  -> /home (often)
  -> /owner/onboarding (org)
  -> /owner/venues/new (venue)
  -> /owner/verify/:placeId (verify)
  -> /owner/import/bookings (separate feature)
```

AFTER

```text
/owners/get-started (public)
  -> CTA: /register/owner?redirect=/owner/get-started
  -> /owner/get-started (hub)
       - Create org (required)
       - Add venue OR Claim listing (optional)
       - Import bookings (optional; ICS/CSV/XLSX supported)
       - Continue to verification if venue created

/list-your-venue
  -> permanent redirect to /owners/get-started
```

## Invariants / Constraints

- Explicit `redirect` query param always wins (booking flows must never break).
- Owner setup hub must be accessible before an organization exists (do not place it behind the owner layout org gate).
- Bookability is still gated by verification + `reservationsEnabled=true` (unchanged).
- Import bookings is already end-to-end (upload -> normalize -> edit -> commit); do not design onboarding that depends on deferred import features.

## Development Phases

| Phase | Deliverable | Parallelizable |
|------:|------------|----------------|
| 1 | Route contract + SEO redirect policy | Yes |
| 2 | Public marketing page `/owners/get-started` + `/list-your-venue` redirect + sitemap/internal links | Yes |
| 3 | Auth entry points (`/register/owner`, role chooser on `/register`) | Yes |
| 4 | Protected owner setup hub `/owner/get-started` | Partial |
| 5 | Default portal routing (post-login SSR) + persistence | Partial |
| 6 | QA + release checklist | No |
| 7 | Follow-up: setup hub "Add venue" redirects to verification | Yes |

## Dependencies Graph

```text
Phase 1 (route contract)
  -> Phase 2 (marketing + redirect)
  -> Phase 3 (auth entrypoints)

Phase 4 (owner hub)
  -> depends on existing org/place/claim/import APIs (already present)

Phase 5 (default portal)
  -> depends on: persistence choice + post-login router
```

## Success Criteria

- [x] `/owners/get-started` exists, is indexable, and has canonical metadata.
- [x] `/list-your-venue` permanently redirects to `/owners/get-started`.
- [x] All internal links and sitemap entries point to `/owners/get-started` (not `/list-your-venue`).
- [x] `/register/owner` exists and lands users into `/owner/get-started` after signup.
- [x] `/register` shows a Player vs Owner chooser only when intent is unknown.
- [x] `/owner/get-started` lets a new owner create an org, optionally add/claim a venue, optionally start an import, and proceed.
- [x] After login with no explicit redirect param, owners land in `/owner` by default; players land in `/home`.
- [x] `pnpm lint`, `pnpm build`, and `TZ=UTC pnpm build` pass.

Note:
- `defaultPortal=owner` is set when the user creates their first organization; owners without an organization will still route to `/home` unless they arrive via an explicit owner `redirect`.

---

## Shared / Contract

- [x] Add route constants:
  - public: `/owners/get-started`
  - guest: `/register/owner`
  - protected: `/owner/get-started`
  - protected: `/post-login` (recommended implementation mechanism)
- [x] Redirect precedence rule:

```text
1) if redirect query param exists => honor it
2) else => route via /post-login (server decides)
```

- [x] Analytics event names (baseline):
  - `funnel.owner_get_started_viewed`
  - `funnel.owner_get_started_cta_clicked`
  - `funnel.owner_register_owner_started`
  - `funnel.owner_org_created`
  - `funnel.owner_venue_created`
  - `funnel.owner_claim_submitted`
  - `funnel.owner_import_started`

## Server / Backend

- [x] Decide persistence strategy for default portal:
  - Recommended: new `user_preferences` table keyed by `user_id`
  - Alternative: add `default_portal` column to `user_roles`
- [x] Add a server-only "post login" routing page that inspects session + preference + org existence and redirects.
- [x] Set `defaultPortal=owner` when an owner creates their first organization.
- [ ] (Optional) Add a settings toggle to change default portal later.

## Client / Frontend

- [x] Build `/owners/get-started` landing page (copy + funnel structure).
- [x] Replace `/list-your-venue` with redirect behavior and update all internal links.
- [x] Add `/register/owner` and add role chooser to `/register` when intent is unknown.
- [x] Implement `/owner/get-started` hub with the core cards.
