# Checkpoint 07

**Date:** 2026-01-13  
**Previous Checkpoint:** checkpoint-06.md  
**Stories Covered:** US-07-06, US-10-06, US-12-01 through US-12-04, US-15-01 through US-15-06

---

## Summary

Captured user stories that existed in `agent-plans/user-stories/` but were not yet included in a checkpoint:

- Owner reservation ops court filtering (multi-court usability)
- Reservation policy behaviors (and docs alignment)
- Place photo uploads (owner-managed)
- Organization-scoped payment methods + organization-scoped reservation policy defaults (superseding legacy payment-instructions and court-scoped policy direction)

This checkpoint also explicitly references related technical planning updates in `agent-plans/` that represent fixes/standardization work not expressed as new user stories.

---

## Stories in This Checkpoint

| ID | Domain | Story | Status |
|----|--------|-------|--------|
| US-07-06 | 07-owner-confirmation | Owner Filters Reservation Ops by Court | Active |
| US-10-06 | 10-asset-uploads | Owner Uploads Place Photos | Active |
| US-12-01 | 12-reservation-policies | Owner Configures Reservation Policies Per Court | Superseded (by US-15-05) |
| US-12-02 | 12-reservation-policies | Player Booking Respects Court Policies | Active |
| US-12-03 | 12-reservation-policies | Player Cancels Reservation (All States) | Active |
| US-12-04 | 12-reservation-policies | Reservation State Machine Docs Updated | Active |
| US-15-01 | 15-organization-payment-methods | Owner Manages Organization Payment Methods | Active |
| US-15-02 | 15-organization-payment-methods | Owner Sets Default Payment Method | Active |
| US-15-03 | 15-organization-payment-methods | Player Sees Organization Payment Methods On Payment Page | Active |
| US-15-04 | 15-organization-payment-methods | Payment Methods Are Visible Only To Authorized Players | Active |
| US-15-05 | 15-organization-payment-methods | Platform Applies Organization Reservation Policy Defaults | Active |
| US-15-06 | 15-organization-payment-methods | Owner Sees Payment Method Setup Reminders | Active |

---

## Domains Touched

| Domain | Stories Added |
|--------|---------------|
| 07-owner-confirmation | 1 |
| 10-asset-uploads | 1 |
| 12-reservation-policies | 4 |
| 15-organization-payment-methods | 6 |

---

## Key Decisions

- Multi-court owners need a consistent court filter across owner reservation ops (and it should persist during navigation).
- Payment account details must be treated as sensitive: only exposed in a reservation payment context to the authorized player.
- Reservation timing rules move toward organization-scoped defaults; prior court-scoped policy story is superseded.
- Owner UX should nudge payment method setup when required for smooth paid reservation flows.

---

## Agent Plan Deltas (Non-story Fixes / Standardization)

These documents represent implementation planning and correctness fixes that are important to ship, but are not expressed as new product-level user stories.

| Plan | Theme |
|------|-------|
| `agent-plans/24-trpc-react-query-hooks/24-00-overview.md` | Standardize client data fetching to `trpc.*.useQuery/useMutation` + `trpc.useUtils()` invalidation |
| `agent-plans/20-timezone-alignment/20-00-overview.md` | Align booking/availability/pricing calculations to `place.timeZone` |
| `agent-plans/25-time-slot-datetime-validation/25-00-overview.md` | Normalize time slot datetimes to UTC `Z` ISO on the wire |
| `agent-plans/18-slot-hours-derivation/18-00-overview.md` | Derive bulk slot creation from court hours windows (remove manual time inputs) |
| `agent-plans/17-payment-flow-ux/17-00-overview.md` | Centralize payment instructions in payment route; remove duplicates in booking review |
| `agent-plans/15-reservation-refresh/15-00-overview.md` | Add refresh controls + reservation event timeline |
| `agent-plans/23-google-maps-embed-poc/23-00-overview.md` | Public map/embed PoC + hardening guidance |
| `agent-plans/27-organization-payment-methods/27-00-overview.md` | Implementation plan for org payment methods + org policy defaults |

---

## Open Questions

- [ ] Should court-scoped reservation policies remain as an advanced setting later, or is org-scoped policy the permanent direction?
- [ ] For payment methods: which reservation statuses should be considered “payment-related” for disclosure (e.g., only `AWAITING_PAYMENT`)?

---

## References

| Document | Path |
|----------|------|
| Context | `agent-plans/context.md` |
| Stories | `agent-plans/user-stories/` |
| Agent Plans | `agent-plans/` |
