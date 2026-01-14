# Organization Payment Methods - User Stories

## Overview

This domain defines how court owners (organizations) configure **payment methods** for peer-to-peer (P2P) payments.

Owners can add multiple payment methods (e.g., GCash, bank transfer) and provide **per-method instructions**. One method can be set as the **default**.

Players see these payment methods only when they have an active reservation that requires payment.

This domain also introduces an **organization-scoped reservation policy** (system defaults for now) to replace place-scoped policy storage.

---

## References

| Document | Path |
|----------|------|
| PRD (Current) | `business-contexts/kudoscourts-prd-v1.2.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| P2P Payment Stories | `agent-plans/user-stories/08-p2p-reservation-confirmation/` |
| Reservation Policies (Legacy Scope) | `agent-plans/user-stories/12-reservation-policies/` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-15-01 | Owner Manages Organization Payment Methods | Active | US-08-01-02 |
| US-15-02 | Owner Sets Default Payment Method | Active | - |
| US-15-03 | Player Sees Organization Payment Methods On Payment Page | Active | US-08-01-02 |
| US-15-04 | Payment Methods Are Visible Only To Authorized Players | Active | - |
| US-15-05 | Platform Applies Organization Reservation Policy Defaults | Active | US-12-01 |
| US-15-06 | Owner Sees Payment Method Setup Reminders | Active | - |

---

## Summary

- Total: 6
- Active: 6
- Superseded: 0
