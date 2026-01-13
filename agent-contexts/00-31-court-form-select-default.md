# [00-31] Court Form Select Default

> Date: 2026-01-13
> Previous: 00-30-time-slot-utc-normalization.md

## Summary

Adjusted `CourtForm` so the place/sport selects only auto-select when there is exactly one available option, preventing unintended defaults when multiple choices exist.

## Changes Made

### UI Behavior

| File | Change |
|------|--------|
| `src/features/owner/components/court-form.tsx` | Only set `placeId`/`sportId` automatically when option list length is `=== 1` |

## Key Decisions

- Avoid implicit defaults when multiple options exist to reduce accidental submissions and confusion.
- Keep existing convenience behavior when there is a single valid option.

## Next Steps (if applicable)

- [ ] None

## Commands to Continue

```bash
pnpm lint
pnpm build
```
