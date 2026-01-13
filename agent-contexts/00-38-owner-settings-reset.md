# [00-38] Owner Settings Reset

> Date: 2026-01-13
> Previous: 00-37-organization-payment-methods.md

## Summary

Fixed the owner settings page render loop by stabilizing form reset inputs, and reset the dev database using push/seed flows after migration conflicts.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/settings/page.tsx` | Memoize organization fields and reset form only when primitives change to avoid max update depth loop. |

### Environment / Ops

| File | Change |
| --- | --- |
| `pnpm db:push` | Applied schema changes after reset. |
| `pnpm db:seed:sports` | Seeded sports data in dev. |

## Key Decisions

- Use primitive memoization + stable `form.reset` dependencies to prevent re-render loops caused by `useCurrentOrganization` returning new objects each render.
- Prefer `db:push` in dev after reset to avoid enum conflicts from re-running baseline migrations.

## Next Steps (if applicable)

- [ ] Verify owner settings page loads without infinite skeleton.
- [ ] Run `pnpm db:seed` as needed for full fixture data.

## Commands to Continue

```bash
pnpm db:seed
pnpm dev
```
