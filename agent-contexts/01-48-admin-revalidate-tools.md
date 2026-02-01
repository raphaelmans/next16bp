# [01-48] Admin Revalidate Tools

> Date: 2026-02-02
> Previous: 01-47-email-verification-screen.md

## Summary

Added an admin-only tools page that triggers on-demand revalidation of the home page to clear stale featured content.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/tools/revalidate/actions.ts` | Added a server action guarded by `requireAdminSession` that calls `revalidatePath("/")`. |
| `src/app/(admin)/admin/tools/revalidate/page.tsx` | Added an admin tools UI with confirmation and toast feedback to trigger revalidation. |

## Key Decisions

- Used a server action for revalidation to keep it admin-only without adding a public API route.
- Added explicit confirmation to prevent accidental cache invalidation.

## Next Steps (if applicable)

- [ ] Consider adding links to the new admin tool in the admin navigation if desired.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
