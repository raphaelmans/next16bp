# Reservation Policies - User Stories

## Overview

This domain adds **per-court reservation policies** so that different courts can enforce different reservation behavior.

Core policy goals:
- Court owners can configure reservation policies **per court**
- Player booking and cancellation behavior is enforced **server-side**
- Owner confirmation is **optional per court** (toggle)
- Reservation TTLs are **court-specific** (not hardcoded)

---

## References

| Document | Path |
|----------|------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Reservation State Machine | `docs/reservation-state-machine.md` |
| Owner Ops Context | `agent-contexts/00-13-owner-reservation-ops.md` |
| Owner Confirmation Stories | `agent-plans/user-stories/07-owner-confirmation/` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-12-01 | Owner Configures Reservation Policies Per Court | Active | - |
| US-12-02 | Player Booking Respects Court Policies | Active | - |
| US-12-03 | Player Cancels Reservation (All States) | Active | - |
| US-12-04 | Reservation State Machine Docs Updated | Active | - |

---

## Summary

- Total: 4
- Active: 4
- Superseded: 0
