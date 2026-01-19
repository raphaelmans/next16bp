# [00-63] Form Dirty Submit

> Date: 2026-01-19
> Previous: 00-62-amenities-discovery-filters.md

## Summary

Allowed Supabase storage images in Next.js config and updated form submit gating to rely on `isDirty` so Save Changes enables after province/city updates.

## Changes Made

### Configuration

| File | Change |
| --- | --- |
| `next.config.ts` | Added Supabase storage host to `images.remotePatterns`. |

### Forms

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Removed `isValid` from submit disabled logic for the court edit form. |
| `src/features/owner/components/place-form.tsx` | Removed `isValid` from submit disabled logic for the place form. |
| `src/app/(owner)/owner/settings/page.tsx` | Removed `isValid` from org/payment submit disabled logic to track `isDirty` only. |

## Key Decisions

- Use `isDirty` as the sole gating flag for Save Changes to avoid false negatives when select fields update.

## Next Steps (if applicable)

- [ ] Restart the dev server to apply Next.js image config changes.
- [ ] Verify Save Changes enables after province/city updates in affected forms.

## Commands to Continue

```bash
pnpm dev
```
