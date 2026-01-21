# Owner Onboarding Court Verification - Master Plan

## Overview

Simplify the onboarding path for new organizations with 0 courts.

Change the default flow from a court setup wizard (schedule/pricing/slots) into a minimum onboarding sequence:

- Place (venue) creation
- One-time court creation (court details only)
- Place verification

This plan intentionally keeps the existing court setup wizard and slot management flows intact for later configuration.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/02-court-creation/02-08-owner-onboards-place-one-time-court.md` |
| Related Plan | `agent-plans/46-place-verification/46-00-overview.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Add one-time court creation route + redirect wiring | 1A | Yes |
| 2 | QA + regression checks | 2A | No |

---

## Module Index

| ID | Module | Plan File |
|----|--------|----------|
| 1A | Onboarding redirects + one-time court creation page | `48-01-onboarding-routing-and-page.md` |
| 2A | QA checklist + rollout notes | `48-02-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| New onboarding route | Use `/owner/places/{placeId}/courts/new` as a "court-only" page | Avoid forcing schedule/pricing/slot setup during initial onboarding |
| Wizard behavior | Keep `/owner/places/{placeId}/courts/setup` unchanged | Owners can still do full setup later; reduces regression risk |
| Post-court-create redirect | Always redirect to `/owner/verify/{placeId}` | Makes verification the explicit next step after minimum setup |

---

## Success Criteria

- [ ] After creating a place, owner is redirected to `/owner/places/{placeId}/courts/new`.
- [ ] Creating a court on that page redirects to `/owner/verify/{placeId}`.
- [ ] Cancel on the one-time court page returns to `/owner/places/{placeId}/courts`.
- [ ] Existing setup wizard flow remains available and unchanged.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
