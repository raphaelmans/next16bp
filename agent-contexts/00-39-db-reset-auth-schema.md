# [00-39] DB Reset Auth Schema

> Date: 2026-01-13
> Previous: 00-38-owner-settings-reset.md

## Summary

Attempted a full dev reset and reran migrations, but `drizzle-kit migrate` failed due to missing permissions on the Supabase `auth` schema. Switched to `db:push` to align schema and ran the sports seed script.

## Changes Made

### Database Operations

| File | Change |
| --- | --- |
| `drizzle/0000_jazzy_galactus.sql` | Migration failed on `auth.users` creation due to schema permissions. |
| `drizzle/0001_reservation_policies.sql` | Not applied because migrate failed early. |
| `drizzle/0002_organization_payment_methods.sql` | Applied via `db:push`. |

## Key Decisions

- Used `pnpm db:push` after migrate failed because the `auth` schema is protected by Supabase permissions in dev.
- Proceeded with seeding sports to restore baseline data.

## Next Steps (if applicable)

- [ ] Consider baselining migrations (`db:push -- --init`) for Supabase-managed schemas.
- [ ] Re-run `pnpm db:migrate` after confirming auth schema permissions.

## Commands to Continue

```bash
pnpm db:push
pnpm db:seed:sports
```
