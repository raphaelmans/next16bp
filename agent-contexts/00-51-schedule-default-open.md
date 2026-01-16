# [00-51] Schedule Default Open

> Date: 2026-01-16
> Previous: 00-50-court-schedule-ux.md

## Summary

Updated the court schedule editor to expand all day sections by default and removed the "Fill missing prices" action to simplify the day toolbar.

## Changes Made

### UI Behavior

| File | Change |
|------|--------|
| `src/features/owner/components/court-schedule-editor.tsx` | Defaulted `openDays` to all days on load/copy and removed the "Fill missing prices" button + handler. |

## Key Decisions

- Keep all day collapsibles expanded on load and after copy to align with the clarified UI expectation.
- Remove the bulk fill action entirely rather than hiding it to avoid unused code paths.

## Next Steps (if applicable)

- [ ] None.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
