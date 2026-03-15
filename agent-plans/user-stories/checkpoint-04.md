# Checkpoint 04

**Date:** 2026-01-12  
**Previous Checkpoint:** checkpoint-03.md  
**Stories Covered:** US-14-01 through US-14-11

---

## Summary

Captured the full v1.2 Place/Court migration domain: player discovery and booking flows now operate on **Places** (venues) containing multiple **Court units** (bookable units), with 60-minute slot granularity, time-window pricing, and support for “Any available court” selection.

---

## Stories in This Checkpoint

| ID | Domain | Story | Status |
|----|--------|-------|--------|
| US-14-01 | 14-place-court-migration | Player Discovers Places With Sport Filters | Active |
| US-14-02 | 14-place-court-migration | Player Views Place Detail And Chooses Court Unit | Active |
| US-14-03 | 14-place-court-migration | Player Chooses Duration In 60-Minute Increments | Active |
| US-14-04 | 14-place-court-migration | Player Books A Specific Court (Mutual Confirmation) | Active |
| US-14-05 | 14-place-court-migration | Player Books “Any Available Court” At A Place | Active |
| US-14-06 | 14-place-court-migration | Owner Creates A Place With Multiple Courts | Active |
| US-14-07 | 14-place-court-migration | Owner Configures Day-Specific Court Hours (Incl. Overnight) | Active |
| US-14-08 | 14-place-court-migration | Owner Configures Hourly Pricing Rules Per Court | Active |
| US-14-09 | 14-place-court-migration | Owner Publishes 60-Minute Slots With Prices | Active |
| US-14-10 | 14-place-court-migration | Platform Migrates Existing Court Listings Into Place/Court Model | Active |
| US-14-11 | 14-place-court-migration | Owner Filters Slots/Reservations By Place And Court | Active |

---

## Domains Touched

| Domain | Stories Added |
|--------|---------------|
| 14-place-court-migration | 11 |

---

## Key Decisions

- **Model split:** Treat “Place” as venue/listing and “Court” as the bookable unit (1 court = 1 sport).
- **Granularity:** All booking durations are multiples of 60 minutes; slots are published in 60-minute increments.
- **Any-available selection:** When booking “Any available”, choose the **lowest total price** option across matching courts.
- **Overnight support:** Court hours can span midnight (end < start) and are treated as overnight availability.

---

## Open Questions

- [ ] Confirm long-term redirect/alias strategy for legacy `/courts/*` routes vs new `/places/*` routes.

---

## References

| Document | Path |
|----------|------|
| Domain Stories | `agent-plans/user-stories/14-place-court-migration/` |
| PRD v1.2 | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD Spec v1.2 | `business-contexts/kudoscourts-erd-specification-v1.2.md` |
| Context | `agent-plans/context.md` |
