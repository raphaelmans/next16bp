# [00-81] Select Defaults Async

> Date: 2026-01-21
> Previous: 00-80-admin-photo-upload-consistency.md

## Summary

Fixed async select default rendering by gating form render until async options
and record data hydrate, then resetting the form with normalized province/city
values. Centralized province/city normalization so admin and owner edit flows
behave consistently.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/shared/lib/ph-location-data.ts` | Added `resolveProvinceCityValues` helper and normalized `findCityByNameAcrossProvinces` to use name-aware matching. |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Reused shared resolver to compute province/city defaults and gated form render until defaults reset. |
| `src/features/owner/components/place-form.tsx` | Added async reset + ready gate pattern for edit flows and normalized province/city defaults via shared resolver. |
| `src/components/form/fields/StandardFormSelect.tsx` | Restored leaf-only `SelectValue` usage after debugging logs. |
| `AGENTS.md` | Documented async default/reset + loading gate convention. |

### Documentation

| File | Change |
| --- | --- |
| `/Users/raphaelm/Documents/Coding/node-architecture/client/core/forms.md` | Added async select defaults pattern and example. |

## Key Decisions

- Use `reset` after both record data and async options are ready, and block form
  render until the reset completes to avoid initial placeholder renders.
- Centralize province/city normalization in shared helpers to avoid duplicated
  matching logic across admin/owner flows.

## Next Steps

- [ ] Apply the same async reset + ready gate pattern to any other edit forms
      that hydrate selects from async options (if needed).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
