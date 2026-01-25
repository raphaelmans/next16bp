# [01-11] Bookings Import Plan Update

> Date: 2026-01-26
> Previous: 01-10-bookings-import-wiring.md

## Summary

Updated the bookings import planning artifacts to cover the post-upload epic work (draft persistence, normalization, review/edit UI, and commit) and tightened the dev checklist to explicitly match US-66-02 constraints.

## Changes Made

### Planning

| File | Change |
|------|--------|
| `agent-plans/context.md` | Added changelog entry for the new 71 review/commit plan. |
| `agent-plans/70-bookings-import-owner-ui/70-00-overview.md` | Marked upload + wiring work as completed and checked success criteria. |
| `agent-plans/70-bookings-import-owner-ui/70-02-import-state-and-wiring.md` | Updated endpoint list (includes `aiUsage`) and linked to the new review/commit plan. |
| `agent-plans/71-bookings-import-review-commit/71-00-overview.md` | New master plan for the remaining epic scope after upload. |
| `agent-plans/71-bookings-import-review-commit/71-01-draft-persistence-and-resume.md` | Proposed DB model + resume endpoints. |
| `agent-plans/71-bookings-import-review-commit/71-02-normalization-pipeline.md` | Planned server normalization flow with AI one-time guard and row-level validations. |
| `agent-plans/71-bookings-import-review-commit/71-03-review-edit-ui.md` | Planned review/edit page route, table, edit dialog, filters, AI UX. |
| `agent-plans/71-bookings-import-review-commit/71-04-commit-blocks.md` | Planned commit strategy (MAINTENANCE blocks), idempotency map, partial failure reporting. |
| `agent-plans/71-bookings-import-review-commit/71-05-qa.md` | QA checklist for the epic. |
| `agent-plans/71-bookings-import-review-commit/71-99-deferred.md` | Explicit deferred items. |
| `agent-plans/71-bookings-import-review-commit/bookings-import-review-commit-dev1-checklist.md` | Added explicit items for hour-alignment validation, duplicate detection, commit gating, upload->review redirect, AI confirmation UX, and post-commit job status updates. |

## Key Decisions

- Commit imported bookings as `MAINTENANCE` blocks for MVP to block availability without introducing walk-in pricing semantics.
- Enforce one-time AI per venue at the server layer and require explicit confirmation in the UI.

## Open Items

- Add explicit checklist coverage for overlap handling (existing blocks/reservations) and idempotent retry semantics.

## Commands to Continue

```bash
# No commands required; planning-only update.
```
