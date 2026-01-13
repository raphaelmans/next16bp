# [00-27] Publish Review Layout

> Date: 2026-01-13
> Previous: 00-26-schedule-pricing-merge.md

## Summary

Adjusted the Step 3 publish review layout to reduce visual weight by stacking court details vertically and positioning it as the right column on large screens.

## Changes Made

### UI Layout

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Swapped review cards so Schedule & pricing is left and Court details is right; switched details to vertical label/value stacks; constrained right column width for cleaner hierarchy. |

## Key Decisions

- Keep schedule summary wide for scanning; move details to a narrower right column.
- Use vertical label/value stacks to reduce horizontal bulk on smaller screens.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` if additional UI tweaks are added.

## Commands to Continue

```bash
pnpm lint
```
