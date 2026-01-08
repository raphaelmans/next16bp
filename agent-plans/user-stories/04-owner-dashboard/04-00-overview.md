# Owner Dashboard - User Stories

## Overview

The Owner Dashboard feature domain covers the authenticated experience for court owners managing their organization, courts, reservations, and settings through the `/owner/*` routes.

This domain focuses on wiring the owner dashboard UI to real backend data, replacing mock/placeholder data with actual tRPC queries. The owner dashboard serves as the primary management interface for organization owners to:

- View and manage their courts
- Monitor reservation activity and pending payments
- Update organization settings and profile
- Track business metrics (simplified for MVP)

The dashboard follows a consistent layout pattern with a sidebar for navigation and role-appropriate navbar. All data is scoped to the owner's organization.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 4.2 (Owner persona) |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |
| UI Context | `agent-contexts/00-04-ux-flow-implementation.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-04-01 | Owner Views Real Dashboard Data | Active | - |

---

## Related Domains

| Domain | Relationship |
|--------|--------------|
| 01-organization | Owner must have an organization (prerequisite) |
| 02-court-creation | Courts are created and managed from owner dashboard |
| 03-court-reservation | Reservations are managed from owner dashboard |

---

## Summary

- Total: 1
- Active: 1
- Superseded: 0
