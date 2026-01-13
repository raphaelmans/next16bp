# Checkpoint 06

**Date:** 2026-01-12  
**Previous Checkpoint:** checkpoint-05.md  
**Stories Covered:** US-14-14 through US-14-15

---

## Summary

Added a unified court setup wizard and configuration copy workflow so owners can configure multiple courts quickly without bouncing between pages.

---

## Stories in This Checkpoint

| ID | Domain | Story | Status |
|----|--------|-------|--------|
| US-14-14 | 14-place-court-migration | Owner Uses Court Setup Wizard | Active |
| US-14-15 | 14-place-court-migration | Owner Copies Hours And Pricing From Another Court | Active |

---

## Domains Touched

| Domain | Stories Added |
|--------|---------------|
| 14-place-court-migration | 2 |

---

## Key Decisions

- Court setup should be a stepper wizard with forced save on details.
- Hours/pricing can be copied from any court in the same organization.
- Copy behavior replaces target configuration and keeps currency unchanged.

---

## Open Questions

- [ ] Confirm whether copy actions should warn when source and target time zones differ.
