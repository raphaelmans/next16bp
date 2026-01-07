# Onboarding - User Stories

## Overview

The Onboarding feature domain covers the complete user journey from first visit through authenticated platform usage. This includes authentication flows (sign up, sign in, sign out), profile completion, and navigation patterns across all platform areas.

KudosCourts follows a player-first approach where users can discover courts without authentication, but must sign in to make reservations. The onboarding experience is designed to be minimal-friction while ensuring users provide necessary contact information for bookings. Authenticated users land on a personalized `/home` page that serves as a central hub for quick actions and status updates.

Navigation is consistent across three distinct areas: public discovery, authenticated account management, and role-specific dashboards (owner/admin). Each area follows established patterns for breadcrumbs, back navigation, and cross-dashboard switching.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |
| UI Context | `agent-contexts/00-04-ux-flow-implementation.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-00-01 | User Authentication Flow | Active | - |
| US-00-02 | User Completes Profile | Active | - |
| US-00-03 | User Navigates Public Area | Active | - |
| US-00-04 | User Navigates Account Area | Active | - |
| US-00-05 | Owner Navigates Dashboard | Active | - |
| US-00-06 | Admin Navigates Dashboard | Active | - |
| US-00-07 | Home Page for Authenticated Users | Active | - |
| 00-08 | Bug Fix: Legacy Dashboard Redirect | ✅ Fixed | - |

---

## Summary

- Total: 7 user stories + 1 bug fix
- Active: 7
- Superseded: 0
- Fixed: 1
