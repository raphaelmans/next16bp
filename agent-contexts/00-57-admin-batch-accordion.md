# [00-57] Admin Batch Accordion

> Date: 2026-01-18
> Previous: 00-56-court-social-metadata.md

## Summary

Added a multi-open accordion layout to the admin batch curated courts form and placed an "Add Row Below" action at the end of each batch item to reduce scrolling friction.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/batch/page.tsx` | Wrapped batch items in accordion, added per-item add button, and aligned Google Maps preview block with available `GoogleLocResult` fields. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/38-admin-courts-batch-accordion/38-00-overview.md` | Created master plan for accordion + add-row update. |
| `agent-plans/38-admin-courts-batch-accordion/38-01-admin-batch-accordion.md` | Added Phase 1 implementation details. |

## Key Decisions

- Used a multi-open accordion so multiple batch items can remain expanded.
- Placed the per-item "Add Row Below" action at the bottom of each batch card stack to avoid scroll-to-top friction.

## Next Steps (if applicable)

- [ ] Resolve `pnpm lint` formatting failure for the minified provinces/cities JSON (unrelated to this change).

## Commands to Continue

```bash
pnpm lint
```
