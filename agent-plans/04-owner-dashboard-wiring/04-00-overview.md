# Owner Dashboard Wiring - Implementation Plan

## Overview

This plan implements US-04-01 (Owner Views Real Dashboard Data) by replacing all mock/placeholder data in the owner dashboard with real tRPC queries to backend endpoints.

### User Story Reference

- **Story:** `agent-plans/user-stories/04-owner-dashboard/04-01-owner-views-real-data.md`
- **Checklist:** `agent-plans/user-stories/04-owner-dashboard/04-01-implementation-checklist.md`

### Problem Statement

The owner dashboard (`/owner/*` routes) currently displays hardcoded mock data instead of real data from the user's organization. This includes:
- Mock organization name ("My Sports Complex") instead of real org
- Fake courts list instead of actual courts
- Simulated reservations instead of real bookings
- Placeholder stats instead of derived metrics

### Goal

Wire all owner pages to use real tRPC endpoints so owners see their actual organization, courts, reservations, and stats.

---

## Reference Documents

| Document | Location |
|----------|----------|
| User Story | `agent-plans/user-stories/04-owner-dashboard/04-01-owner-views-real-data.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Scope

### In Scope

| Page | Current State | Target State |
|------|---------------|--------------|
| `/owner` (dashboard) | Mock stats, fake activity | Real court count, pending reservations, Coming Soon placeholders |
| `/owner/courts` | Mock courts list | Real courts from `getMyCourts` |
| `/owner/reservations` | Generated fake reservations | Real reservations from `getForOrganization` |
| `/owner/settings` | Mock org data | Real org from `organization.my` |

### Out of Scope (Deferred)

| Item | Reason |
|------|--------|
| `/owner/courts/[id]/slots` | Keep mock - separate story for slots management |
| Logo upload | Keep mock - requires Supabase Storage setup |
| Revenue stats | No payment tracking yet - show "Coming Soon" |
| Today's Bookings timeline | Requires time slot queries - show "Coming Soon" |
| Recent Activity feed | Requires event stream - show "Coming Soon" |

---

## Available Backend Endpoints

All required endpoints exist and are functional:

| Router | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `organization.my` | Get user's organizations | ✅ Ready |
| `organization.update` | Update org basic info | ✅ Ready |
| `organization.updateProfile` | Update org profile | ✅ Ready |
| `courtManagement.getMyCourts` | Get owner's courts | ✅ Ready |
| `courtManagement.getById` | Get single court details | ✅ Ready |
| `courtManagement.deactivate` | Deactivate a court | ✅ Ready |
| `reservationOwner.getForOrganization` | Get org reservations | ✅ Ready |
| `reservationOwner.getPendingCount` | Pending reservation count | ✅ Ready |
| `reservationOwner.confirmPayment` | Confirm reservation | ✅ Ready |
| `reservationOwner.reject` | Reject reservation | ✅ Ready |

---

## Implementation Phases

| Phase | Description | Files | Time |
|-------|-------------|-------|------|
| 1 | Create shared organization hook | 2 files | 30 min |
| 2 | Wire courts page | 2 files | 45 min |
| 3 | Wire dashboard + Coming Soon cards | 3 files | 1 hour |
| 4 | Wire reservations page | 2 files | 1 hour |
| 5 | Wire settings page | 2 files | 45 min |
| 6 | Testing & verification | - | 30 min |

**Total Estimated Time:** ~5 hours

---

## Developer Assignment

This work is split into two parallel tracks for UI developers. No backend changes needed - all endpoints exist.

| Checklist | Focus | Time | Dependencies |
|-----------|-------|------|--------------|
| `ui-dev1-hooks-checklist.md` | Hook implementations (tRPC wiring) | 2 hours | None |
| `ui-dev2-pages-checklist.md` | Page updates (wire to hooks) | 3 hours | UI Dev 1 Phases 1-2 |

### Parallelization

```
UI Dev 1 (Hooks)              UI Dev 2 (Pages)
─────────────────             ─────────────────
Phase 1: Org hook      ───►   [wait]
Phase 2: Courts hook   ───►   Phase 1: Coming Soon component
         ↓                    Phase 2: Courts page (needs hooks)
Phase 3: Dashboard hook       Phase 3: Dashboard page
Phase 4: Reservations hook    Phase 4: Reservations page
Phase 5: Organization hook    Phase 5: Settings page
                              Phase 6: Testing
```

**Sync Point:** After UI Dev 1 completes Phases 1-2, notify UI Dev 2 to start page wiring.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dashboard stats | Show only 2 (Courts, Pending) | Other stats require data we don't have yet |
| Unavailable features | "Coming Soon" placeholder cards | Better UX than hiding features entirely |
| Logo upload | Toast "Coming Soon" | Storage not set up, but keep UI discoverable |
| Org context | Shared hook `useOwnerOrganization` | Avoid duplicate queries across pages |
| Slots page | Keep mock | Complex feature, separate story |

---

## Success Criteria

- [ ] Owner sees real organization name in sidebar/navbar
- [ ] `/owner/courts` shows real courts (or empty state)
- [ ] `/owner` dashboard shows real stats (Active Courts, Pending Reservations)
- [ ] `/owner/reservations` shows real reservations (or empty state)
- [ ] `/owner/settings` form pre-fills with real org data
- [ ] Saving settings updates real database
- [ ] Build passes with no TypeScript errors
- [ ] No console errors in browser

---

## Document Index

| Document | Description |
|----------|-------------|
| `04-00-overview.md` | This file - master plan |
| `04-01-phase-hooks.md` | Hook implementation details with code |
| `04-02-phase-pages.md` | Page update details with code |
| `ui-dev1-hooks-checklist.md` | **UI Dev 1** - Hook implementations |
| `ui-dev2-pages-checklist.md` | **UI Dev 2** - Page updates |
| `ui-dev-checklist.md` | Combined checklist (single-dev alternative) |
