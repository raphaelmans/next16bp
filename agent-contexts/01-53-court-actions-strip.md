# [01-53] Strip Down Court Actions Dropdown

> Date: 2026-02-02
> Previous: 01-52-manage-block-composability.md

## Summary

Simplified the court actions dropdown menu in the owner courts table by removing 3 menu items and updating the row click destination to go directly to the edit page instead of the setup wizard.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/courts-table.tsx` | Removed Setup Wizard, Availability, and View Public Page menu items from `CourtActionsDropdown` |
| `src/features/owner/components/courts-table.tsx` | Changed `handleRowClick` from `appRoutes.owner.places.courts.setup(…, "details")` to `appRoutes.owner.places.courts.edit(…)` |
| `src/features/owner/components/courts-table.tsx` | Removed unused `Clipboard` and `ExternalLink` lucide-react imports |

## Key Decisions

- Kept Edit Details, Schedule & Pricing, View Bookings, and Deactivate as the remaining 4 menu items
- Row click now navigates to the edit page directly, bypassing the setup wizard
- `Clock` import retained (used by Schedule & Pricing item)

## Dropdown Items (After)

1. Edit Details
2. Schedule & Pricing
3. View Bookings
4. Deactivate (conditional, active courts only)
