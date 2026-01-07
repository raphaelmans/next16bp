# Court Creation - User Stories

## Overview

The Court Creation feature domain enables two types of court listings on the platform: admin-curated courts for bootstrapping inventory, and owner-created courts for active reservation management.

**Curated Courts** are created by platform administrators to populate the discovery experience before owners onboard. These are view-only listings with external contact information, allowing players to find courts even if the owner hasn't joined the platform yet.

**Owner Courts** are created by organization owners who want to accept reservations through KudosCourts. These courts are immediately reservable and linked to the owner's organization for management.

This domain depends on the organization flow (01-organization) and feeds into the reservation flow (03-court-reservation).

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 5 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-02-01 | Admin Creates Curated Court | Active | - |
| US-02-02 | Owner Creates Court | Active | - |

---

## Summary

- Total: 2
- Active: 2
- Superseded: 0
