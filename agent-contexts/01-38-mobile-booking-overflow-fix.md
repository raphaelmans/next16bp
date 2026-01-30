# [01-38] Mobile Booking Overflow Fix

> Date: 2025-01-30
> Previous: 01-37-import-replace-with-guest.md

## Summary

Fixed horizontal overflow on the owner bookings page at 375px mobile viewports. The previous nav row (chevrons + date popover + "Today" button + 7-col date grid) was too wide. Adopted the place-detail-client.tsx pattern: full-width date button + Dialog-based calendar instead of inline chevron nav + Popover.

## Changes Made

### Layout Fix

| File | Change |
|------|--------|
| `src/shared/components/layout/dashboard-layout.tsx` | Added `max-w-full overflow-x-hidden` to `<main>` to prevent content from pushing wider than viewport |

### Mobile Nav Restructure

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Replaced inline chevron+Popover nav with full-width date button + Dialog calendar (matching place-detail pattern) |
| `src/app/(owner)/owner/bookings/page.tsx` | Added `Dialog`, `DialogContent`, `DialogTitle` imports; removed unused `ChevronDown` import |

### Reverted (No Changes Needed)

| File | Change |
|------|--------|
| `src/features/discovery/components/mobile-date-strip.tsx` | Reverted to git state — overflow was caused by parent layout, not the strip |

## Key Decisions

- **Dialog over Popover** for mobile calendar — Popovers can overflow the viewport on small screens; Dialog opens as a centered modal
- **Removed chevron month-nav buttons** from mobile — they competed for horizontal space; the calendar Dialog provides month navigation instead
- **Full-width date button** — inspired by `place-detail-client.tsx` (lines 2460–2482) which handles mobile dates without overflow using this pattern

## Next Steps

- [ ] Verify on physical device at 375px — no horizontal scroll, all 7 day buttons visible
