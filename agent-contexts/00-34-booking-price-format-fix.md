# [00-34] Booking Price Format Fix

> Date: 2026-01-13
> Previous: 00-33-google-embed-ui.md

## Summary

Aligned booking contract pricing with summary formatting to avoid cents/units mismatch in the booking confirmation flow.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Switched contract pricing display to `formatCurrency` for cents-based totals. |

## Key Decisions

- Used the shared `formatCurrency` helper to ensure consistent cents-to-display conversion across booking UI.

## Next Steps (if applicable)

- [ ] Verify booking UI totals in browser if needed.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
