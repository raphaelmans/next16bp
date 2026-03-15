# 14-place-court-migration - User Stories

## Overview

This domain covers the product and UX changes required to move from the legacy model where a single “court” represented a location, into the v1.2 model:

- **Place** = venue/location listing (multi-sport capable)
- **Court** = a single bookable unit inside a place (1 court = 1 sport)
- **Slot** = availability for a specific court

It includes both:
- **Player-facing UX** (choose sport → choose specific court or “Any available” → book)
- **Owner tooling** (manage places, courts, hours, pricing rules, slots)
- **Migration continuity** (existing listings/reservations remain valid)

---

## References

| Document | Path |
|----------|------|
| PRD v1.2 | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD Spec v1.2 | `business-contexts/kudoscourts-erd-specification-v1.2.md` |
| Reservation Contract | `docs/reservation-state-machine.md` |
| Reservation Contract (Product) | `docs/reservation-state-machine-level-1-product.md` |
| Reservation Contract (Engineering) | `docs/reservation-state-machine-level-2-engineering.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-14-01 | Player Discovers Places With Sport Filters | Active | - |
| US-14-02 | Player Views Place Detail And Chooses Court Unit | Active | - |
| US-14-03 | Player Chooses Duration In 60-Minute Increments | Active | - |
| US-14-04 | Player Books A Specific Court (Mutual Confirmation) | Active | - |
| US-14-05 | Player Books “Any Available Court” At A Place | Active | - |
| US-14-06 | Owner Creates A Place With Multiple Courts | Active | - |
| US-14-07 | Owner Configures Day-Specific Court Hours (Incl. Overnight) | Active | - |
| US-14-08 | Owner Configures Hourly Pricing Rules Per Court | Active | - |
| US-14-09 | Owner Publishes 60-Minute Slots With Prices | Active | - |
| US-14-10 | Platform Migrates Existing Court Listings Into Place/Court Model | Active | - |
| US-14-11 | Owner Filters Slots/Reservations By Place And Court | Active | - |
| US-14-12 | Owner Navigates Court Actions Without Unintended Redirects | Active | - |
| US-14-13 | Owner Is Guided To Configure Hours And Pricing Before Publishing Slots | Active | - |
| US-14-14 | Owner Uses Court Setup Wizard | Active | - |
| US-14-15 | Owner Copies Hours And Pricing From Another Court | Active | - |

---

## Summary

- Total: 15
- Active: 15
- Superseded: 0
