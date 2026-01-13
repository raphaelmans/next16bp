# Checkpoint 05

**Date:** 2026-01-12  
**Previous Checkpoint:** checkpoint-04.md  
**Stories Covered:** US-14-12 through US-14-13

---

## Summary

Refined the owner operational flow for v1.2 by ensuring court configuration pages are reachable without accidental redirects, and by guiding owners to configure **court hours** and **pricing rules** before attempting to publish slots.

---

## Stories in This Checkpoint

| ID | Domain | Story | Status |
|----|--------|-------|--------|
| US-14-12 | 14-place-court-migration | Owner Navigates Court Actions Without Unintended Redirects | Active |
| US-14-13 | 14-place-court-migration | Owner Is Guided To Configure Hours And Pricing Before Publishing Slots | Active |

---

## Domains Touched

| Domain | Stories Added |
|--------|---------------|
| 14-place-court-migration | 2 |

---

## Key Decisions

- Slot publishing UX should **derive pricing from pricing rules** and should guide owners to configure prerequisites (hours + pricing) instead of relying on ad-hoc per-slot inputs.
- "Free" pricing is supported via **0 hourly rate** in pricing rules.

---

## Open Questions

- [ ] Decide canonical representation of "free" in slot records: `priceCents = 0` vs `priceCents = null` (ensure booking flows treat it consistently).
