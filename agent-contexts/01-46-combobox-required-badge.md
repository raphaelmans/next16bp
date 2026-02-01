# [01-46] StandardFormCombobox + Required Badge

> Date: 2026-02-02
> Previous: 01-45-email-otp-auth.md

## Summary

Created a reusable `StandardFormCombobox` component for searchable dropdowns and applied it to Province/City fields in the place form. Changed the "Add new venue" badge from Optional to Required on the owner get-started page.

## Changes Made

### New Component

| File | Change |
|------|--------|
| `src/components/form/fields/StandardFormCombobox.tsx` | New searchable combobox using Popover + Command (cmdk) pattern, matching StandardFormSelect conventions |
| `src/components/form/types.ts` | Added `StandardComboboxProps` interface with `searchPlaceholder` and `emptyMessage` |
| `src/components/form/index.ts` | Exported `StandardFormCombobox` and `StandardComboboxProps` |

### UI Updates

| File | Change |
|------|--------|
| `src/app/(auth)/owner/get-started/page.tsx` | Changed "Add new venue" badge from `<Badge variant="secondary">Optional</Badge>` to `<Badge>Required</Badge>` |
| `src/features/owner/components/place-form.tsx` | Replaced `StandardFormSelect` with `StandardFormCombobox` for province and city fields |

## Key Decisions

- Followed same Popover + Command pattern already used in `court-filters.tsx` for consistency
- Used `CommandItem value={option.label}` so cmdk filters by display label text
- Clicking a selected option deselects it (toggles to empty string)
- Popover width matches trigger via `w-[--radix-popover-trigger-width]`
