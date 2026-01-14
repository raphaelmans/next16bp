# [00-45] Form Standardization + CourtForm

> Date: 2026-01-14
> Previous: 00-44-tabs-content-visibility-fix.md

## Summary

Standardized toast handling and Sonner styling, introduced the StandardForm component layer, and migrated CourtForm to react-hook-form with toast-only server errors and reset-on-success behavior. Court setup/edit pages now use `mutateAsync` submit paths and forms no longer clear on failed submissions.

## Changes Made

### UI + Form Implementation

| File | Change |
|------|--------|
| `src/components/ui/sonner.tsx` | Added rich color tokens + bottom-left positioning. |
| `src/components/providers.tsx` | Mounted global `<Toaster />`. |
| `src/shared/lib/toast-errors.ts` | Added reusable toast error helper. |
| `src/components/form/StandardFormProvider.tsx` | StandardFormProvider wrapper for RHF. |
| `src/components/form/StandardFormError.tsx` | Root-level form error display. |
| `src/components/form/fields/StandardFormInput.tsx` | Standard input field wrapper. |
| `src/components/form/fields/StandardFormSelect.tsx` | Standard select field wrapper. |
| `src/components/form/fields/StandardFormCheckbox.tsx` | Standard checkbox field wrapper. |
| `src/components/form/fields/StandardFormField.tsx` | Composition-based form field wrapper. |
| `src/components/form/types.ts` | Shared StandardForm types + props. |
| `src/components/form/index.ts` | Barrel exports for StandardForm components. |
| `src/features/owner/components/court-form.tsx` | Migrated to RHF + Zod, toast-only errors, reset on success. |
| `src/features/owner/schemas/court-form.schema.ts` | Trimmed label + tier label schema. |
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Submit flow uses `submitAsync` and pristine submit is allowed for edit step. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Court creation uses `submitAsync` handler. |
| `src/app/(owner)/owner/courts/[id]/edit/page.tsx` | Updated to `submitAsync`. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/edit/page.tsx` | Updated to `submitAsync`. |

### Documentation + Planning

| File | Change |
|------|--------|
| `agent-plans/32-form-standardization/32-00-overview.md` | New plan for StandardForm + CourtForm migration. |
| `agent-plans/32-form-standardization/32-01-courtform-foundation.md` | Phase plan with field mapping + steps. |
| `agent-plans/32-form-standardization/32-02-form-migration-checklist.md` | Migration checklist for other forms. |
| `agent-plans/32-form-standardization/form-standardization-dev1-checklist.md` | Developer checklist. |
| `guides/` | Refreshed from node-architecture sync. |
| `AGENTS.md` | Added StandardForm + submit conventions. |

## Key Decisions

- Server errors are toast-only (no inline root error) to avoid noisy UI.
- Form reset happens only on success to prevent data loss.
- CourtForm serves as the reference migration for future forms.

## Next Steps (if applicable)

- [ ] Migrate `PlaceForm` to StandardForm + RHF.
- [ ] Follow the new checklist to standardize remaining forms.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
