# Booking Conversion UX (Airbnb + Booking-Inspired) - Master Plan

## Overview

Improve booking conversion by reducing friction in the public → auth → booking funnel and ensuring the user can resume after login without losing selection state.

This plan is intentionally additive and aligns with existing planning work:
- Public schedule view + URL state: `agent-plans/40-public-schedule-view/`
- Public navbar/search routing: `agent-plans/39-public-navbar-consistency/`
- Discovery filters + slugs: `agent-plans/35-courts-discovery-filters/`, `agent-plans/36-ph-location-slugs/`
- Amenities filter: `agent-plans/42-amenities-discovery-filters/`
- Google OAuth auth: `agent-plans/43-google-oauth-auth/`
- Guest removal requests (place detail page contention): `agent-plans/44-guest-removal/`

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| User Stories (Booking) | `agent-plans/user-stories/06-court-reservation/` |
| Public Detail Page | `src/app/(public)/places/[placeId]/page.tsx` |
| Public Schedule Page | `src/app/(public)/courts/[id]/schedule/page.tsx` |
| Login Form | `src/features/auth/components/login-form.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Resume-after-login + telemetry baseline | 1A, 1B | Partial |
| 2 | Auth friction reduction (OAuth + clearer context) | 2A, 2B | Yes |
| 3 | Mobile sticky CTA (schedule + detail) | 3A, 3B | Partial |
| 4 | Top-of-funnel discovery improvements | 4A, 4B | Partial |
| 5 | Place detail contention batching (Plan 44 coordination) | 5A | No |

---

## Module Index

### Phase 1: Resume-after-login + baseline

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Preserve booking selection through auth by redirecting guests to schedule URL | `45-01-resume-after-login.md` |
| 1B | Minimal internal funnel events (log-only) | `45-02-telemetry.md` |

### Phase 2: Auth friction reduction

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Ship Google OAuth (if not yet complete) | `45-03-auth-friction.md` |
| 2B | Login/register contextual messaging for booking redirects | `45-03-auth-friction.md` |

### Phase 3: Mobile sticky CTA

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Mobile sticky CTA on schedule page | `45-04-mobile-sticky-cta.md` |
| 3B | Mobile sticky CTA on place detail page | `45-04-mobile-sticky-cta.md` |

### Phase 4: Discovery improvements

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Amenities filter on /courts (reference Plan 42) | `45-05-discovery.md` |
| 4B | Landing routing consistency (reference Plans 39/35/36) | `45-05-discovery.md` |

### Phase 5: Place detail contention batching

| ID | Module | Plan File |
|----|--------|-----------|
| 5A | Batch edits to `places/[placeId]/page.tsx` to reduce conflicts (Plan 44 coordination) | `45-06-place-detail-batching.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2 ─────┬───── Phase 3 ───── Phase 5
             │                   │
             └───── Phase 4 ─────┘

External plan dependencies:
- Phase 1 depends on Plan 40 schedule URL state.
- Phase 2 depends on Plan 43 OAuth.
- Phase 4 depends on Plans 35/36/39/42.
- Phase 5 coordinates with Plan 44 changes on place detail.
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Resume surface | Schedule page with URL state | Mirrors Booking.com resume behavior; preserves selection across auth |
| Auth requirement | Keep auth required to confirm booking | Matches current product decision |
| Telemetry vendor | None (log-only) | Avoids vendor setup; leverages existing structured logs |
| Place detail edits | Batch changes | `places/[placeId]/page.tsx` is a hotspot (booking UX + guest removal) |

---

## Success Criteria

- [ ] Guest selection is preserved through login (detail → login → schedule with selected slot).
- [ ] Mobile users can always find the primary CTA once a selection exists.
- [ ] Discovery funnel is measurable via minimal log events.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
