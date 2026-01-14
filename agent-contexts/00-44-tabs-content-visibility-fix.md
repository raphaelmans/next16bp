# [00-44] Tabs Content Visibility Fix

> Date: 2026-01-14
> Previous: 00-43-owner-reservations-inbox.md

## Summary

Fixed the owner reservations tabs so inactive panels no longer render visible UI, while keeping panels mounted for accessibility.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/ui/tabs.tsx` | Hid inactive tab panels via `data-[state=inactive]:hidden` to prevent persistent empty states/filters. |

## Key Decisions

- Keep `forceMount` for tabs to satisfy `aria-controls`, but hide inactive panels with CSS.

## Next Steps

- [ ] Re-run `pnpm lint` and `TZ=UTC pnpm build` if desired.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
