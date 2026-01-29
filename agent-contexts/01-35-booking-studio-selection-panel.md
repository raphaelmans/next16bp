# [01-35] Booking Studio Selection Panel

> Date: 2026-01-30
> Previous: 01-34-remove-schedule-page-redirects.md

## Summary

Refactored the owner bookings studio to replace the Block Palette with a unified selection panel, reuse the mobile form in both desktop sidebar and mobile drawer, and introduce selectable timeline rows with clearer selection affordances. DnD is now limited to the draft-row import overlay.

## Changes Made

### Desktop Selection Panel

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Removed Block Palette UI, added selection panel with empty state + form, wired submit/cancel, and unified selection state across views. |

### Selection UI Components

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/selectable-timeline-row.tsx` | New selectable row with hover affordance and range-selection pointer handlers. |
| `src/features/owner/components/booking-studio/selection-panel-form.tsx` | New shared form used by desktop sidebar and mobile drawer. |
| `src/features/owner/components/booking-studio/mobile-create-block-drawer.tsx` | Replaced inline form with `SelectionPanelForm`. |
| `src/features/owner/components/booking-studio/mobile-aware-timeline-row.tsx` | Removed (replaced by selectable row). |

### Store/State Consolidation

| File | Change |
|------|--------|
| `src/features/owner/stores/booking-studio-store.ts` | Unified selection state and guest fields; added selection panel reset logic. |
| `src/features/owner/components/booking-studio/week-day-column.tsx` | Added committed range + onCommitRange to track week-day column selection. |

## Key Decisions

- Removed preset drag-and-drop for blocks; selection now starts from time-slot range selection, matching the mobile flow.
- Centralized guest/notes inputs in a shared form component to keep behavior consistent across desktop sidebar and mobile drawer.
- Kept DnD only for the import overlay to preserve draft-row placement.

## Next Steps

- [ ] Verify selection panel flow in week and day views (empty state, range selection, submit, cancel).
- [ ] Confirm mobile drawer still functions using the shared form.
- [ ] Validate timeline row affordances and hover cues for selectable ranges.

## Commands to Continue

```bash
pnpm format && pnpm lint
TZ=UTC pnpm build
```
