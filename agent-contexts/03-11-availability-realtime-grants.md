---
tags:
  - agent-context
date: 2026-03-09
previous: 03-10-curated-ingestion-pipeline.md
related_contexts:
  - "[[02-05-availability-grid-parity-speed]]"
  - "[[03-08-venue-detail-isr-caching]]"
---

# [03-11] Availability Realtime Grants

> Date: 2026-03-09
> Previous: 03-10-curated-ingestion-pipeline.md

## Summary

Investigated a live availability realtime failure on the public venue page and confirmed the Supabase Realtime join was being accepted before a delayed `system` error rejected the `court_id` filter. The root cause was missing `SELECT` grants on `public.availability_change_event` for `authenticated` and `anon`, not missing publication setup or missing columns.

## Related Contexts

- [[02-05-availability-grid-parity-speed]] - Related availability studio and grid behavior on public booking surfaces
- [[03-08-venue-detail-isr-caching]] - Related public venue detail surface where the realtime failure was observed

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `drizzle/0044_availability_change_event_realtime_grants.sql` | Added raw SQL migration to grant `SELECT` on `public.availability_change_event` to `authenticated` and `anon` |
| `drizzle/meta/_journal.json` | Registered the `0044_availability_change_event_realtime_grants` migration |

### Documentation

| File | Change |
|------|--------|
| `important/real-time/02-availability-sync.md` | Documented the missing-grant failure mode and clarified that `invalid column for filter court_id` means missing `SELECT` privilege |
| `important/real-time/00-overview.md` | Added the operational requirement that realtime needs both publication membership and `SELECT` grants |
| `important/real-time/99-source-files.md` | Added the new grant migration to the realtime source file inventory |

## Tag Derivation (From This Session's Changed Files)

- No `frontend/*` or `backend/*` tags were added because the changed files in this session were migrations, journaling metadata, and architecture docs

## Key Decisions

- Kept the fix as a focused SQL grant migration instead of folding it into application code, because the failure was caused by Supabase Realtime privilege validation in the database layer.
- Treated `db:push:production` as insufficient for this fix, because the successful push did not apply the SQL privilege change and production grants remained unset until the direct `GRANT SELECT` statement was executed.

## Next Steps (if applicable)

- [ ] Re-run a focused live availability subscription probe after the next production deploy window to capture the full `availability-change-stream` join on the page without manual instrumentation ambiguity
- [ ] Decide whether the production `GRANT SELECT` should be backfilled into the tracked migration history separately from the direct database fix

## Commands to Continue

```bash
pnpm exec dotenvx run --env-file=.env.production -- node <<'NODE'
(async()=>{
  const postgres = (await import('postgres')).default;
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    const grants = await sql`
      select
        has_table_privilege('authenticated', 'public.availability_change_event', 'SELECT') as auth_table_select,
        has_column_privilege('authenticated', 'public.availability_change_event', 'court_id', 'SELECT') as auth_court_id_select,
        has_table_privilege('anon', 'public.availability_change_event', 'SELECT') as anon_table_select,
        has_column_privilege('anon', 'public.availability_change_event', 'court_id', 'SELECT') as anon_court_id_select
    `;
    console.log(JSON.stringify(grants, null, 2));
  } finally {
    await sql.end();
  }
})();
NODE
playwright-cli goto https://kudoscourts.ph/venues/test-kudos-courts-complex
```
