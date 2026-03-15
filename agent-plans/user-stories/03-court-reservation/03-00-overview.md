# Court Reservation - User Stories

## Overview

The Court Reservation feature domain enables players to discover and book pickleball courts through a unified platform experience. This covers the complete player journey from court discovery through booking confirmation, including both free and paid reservation flows.

**Free Court Booking** provides immediate confirmation when a player reserves a slot with no payment required.

**Paid Court Booking** implements a P2P payment model where the player pays externally (GCash, bank transfer, cash) and the owner confirms receipt. A 15-minute TTL window ensures fair slot availability while allowing time for payment.

**Owner Confirmation** enables court owners to verify payments and confirm or reject reservations.

This domain depends on court creation (02-court-creation) and time slot management for courts to be bookable.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Sections 7-8 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-03-01 | Player Books Free Court | Active | - |
| US-03-02 | Player Books Paid Court | Active | - |
| US-03-03 | Owner Confirms Payment | Active | - |

---

## Summary

- Total: 3
- Active: 3
- Superseded: 0
