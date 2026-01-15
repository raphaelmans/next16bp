# [00-48] Admin Access SQL Reference

> Date: 2026-01-15  
> Previous: 00-47-admin-batch-curated-courts.md

## Summary

Captured the SQL steps to grant admin access by updating `user_roles` for copy/paste reference.

## Changes Made

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/00-48-admin-access-sql.md` | Added admin access SQL snippet and notes. |

## Key Decisions

- Use `user_roles` upsert (`user_id` unique) to grant `admin`.

## Copy/Paste Reference

```sql
-- 1) Find your user id
select id, email from auth.users where email = 'you@example.com';

-- 2) Upsert admin role
insert into public.user_roles (user_id, role)
values ('<USER_UUID>', 'admin')
on conflict (user_id) do update
set role = 'admin', updated_at = now();
```

## Notes

- Admin routes live under `/admin/*` (example: `/admin/courts`).
- Sign out/in after updating role so session refreshes.

## Commands to Continue

```bash
# No commands required
```
