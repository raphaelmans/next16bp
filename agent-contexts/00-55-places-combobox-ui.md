# [00-55] Places Combobox UI

> Date: 2026-01-17
> Previous: 00-54-courts-copywriting.md

## Summary

Aligned place card layout to keep CTAs consistent and converted the desktop province/city filters into searchable combobox popovers.

## Changes Made

### UI

| File | Change |
| --- | --- |
| `src/shared/components/kudos/place-card.tsx` | Made card content full-height and anchored price/CTA to the bottom for consistent tile alignment. |
| `src/features/discovery/components/court-filters.tsx` | Replaced province/city Selects with Popover + Command comboboxes on desktop and added search/selection state. |

## Key Decisions

- Used flex column + `mt-auto` to keep CTAs aligned regardless of price presence.
- Used shadcn Popover/Command combobox pattern for searchable filters without changing the mobile sheet UI.

## Next Steps (if applicable)

- [ ] Verify combobox UX in the courts page.
- [ ] Run `pnpm lint` if needed.

## Commands to Continue

```bash
pnpm lint
```
