# [01-49] Home Featured Cache Tag

> Date: 2026-02-02
> Previous: 01-48-admin-revalidate-tools.md

## Summary

Added a cache tag for the homepage featured list and wired the admin revalidate action to invalidate the tag with stale-while-revalidate behavior.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/page.tsx` | Wrapped featured list fetch in `unstable_cache` with tag `home:featured`. |
| `src/app/(admin)/admin/tools/revalidate/actions.ts` | Added `revalidateTag("home:featured", "max")` and returned the tag in the response. |
| `src/app/(admin)/admin/tools/revalidate/page.tsx` | Displayed the cache tag and included it in the toast message. |

## Key Decisions

- Used `revalidateTag(..., "max")` to align with Next.js recommended stale-while-revalidate semantics.
- Kept `revalidatePath("/")` alongside tag invalidation for safety.

## Next Steps (if applicable)

- [ ] Consider adding the new tag to any CDN purge workflows.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
