# [00-10] Storage Bucket Seed

> Date: 2026-01-11
> Previous: 00-09-p2p-asset-uploads.md

## Summary

Added a storage bucket seed script, wired an npm command, and documented that buckets are public temporarily. Verified bucket creation via Supabase SQL query.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `scripts/seed-storage-buckets.ts` | Added idempotent seed script with centralized bucket name constants and public bucket configuration. |
| `package.json` | Added `db:seed:buckets` script to run the seed. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/10-asset-uploads/10-00-overview.md` | Updated bucket access to public (temporary) and noted future tightening. |

## Key Decisions

- Buckets are public for now to unblock uploads; tighten with RLS later.
- Bucket names are centralized constants for easy future changes.
- Seed script is idempotent and updates existing bucket settings.

## Next Steps (if applicable)

- [ ] Add RLS and privatize buckets when ready.
- [ ] Implement upload feature phases (2A–2D).

## Commands to Continue

```bash
npm run db:seed:buckets
```
