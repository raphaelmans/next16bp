# Real-Time Architecture

Last updated: 2026-03-11

## Goal
Capture the current modular real-time architecture after the reservation-first and availability event work.

## High-Level Split

The app intentionally uses two event-driven patterns:

- `Reservation` domain: `event notification`
  - Realtime event says reservation state changed
  - Client invalidates scoped canonical queries
  - Server remains authoritative for shaped reservation projections

- `Availability` domain: `event-carried state transfer`
  - Realtime event carries slot/bookability state
  - Client patches matching court-scoped availability caches directly
  - Aggregate place-sport availability still invalidates/refetches when exact patching is unsafe

## Core Modules

- Reservation sync helper: `src/features/reservation/sync.ts`
- Availability query keys: `src/common/query-keys/availability.ts`
- Reservation query keys: `src/common/query-keys/reservation.ts`
- Discovery realtime consumer: `src/features/discovery/realtime.ts`
- Owner optimistic availability helpers: `src/features/owner/hooks/availability-sync.ts`
- Reservation realtime client: `src/common/clients/reservation-realtime-client/index.ts`
- Availability realtime client: `src/common/clients/availability-realtime-client/index.ts`

## Current Behavior

- Reservation pages, alerts, dashboard, chat context, and inbox sync via scoped invalidation.
- Court-scoped discovery availability patches directly from `availability_change_event`.
- Owner availability views use optimistic local patching plus scoped reservation-range invalidation.
- Place-sport aggregate discovery availability still uses scoped invalidation/refetch.
- Availability queries use focus/reconnect recovery as drift protection.

## Operational Requirement — Checklist for New Realtime Tables

Every table subscribed via Supabase Realtime must satisfy **all three** requirements below. Missing any one produces a silent failure (channel joins successfully, then a delayed `system` error rejects it).

### 1. Publication Membership

The table must be in the `supabase_realtime` publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.<table_name>;
```

### 2. SELECT Grants

Subscribing roles must have `SELECT` on the table. The browser Supabase client connects with the publishable key, which maps to the **`anon`** role.

- **Tables with column filters** (e.g. `reservation_id=eq.<id>`): must grant to `anon` because the filter validation trigger (`realtime.subscription_check_filters`) calls `has_column_privilege` for the JWT role, and the filter validation loop only executes when filters are present.
- **Tables without filters** (e.g. `user_notification`): `authenticated` is sufficient since the filter validation loop is skipped entirely.

```sql
-- With filters: grant to both
GRANT SELECT ON TABLE public.<table_name> TO authenticated, anon;
-- Without filters: authenticated is enough
GRANT SELECT ON TABLE public.<table_name> TO authenticated;
```

### 3. Replica Identity (for filtered subscriptions)

If the subscription filters on a **non-PK column**, that column must be in the WAL output. `REPLICA IDENTITY DEFAULT` only includes PK columns. Set `FULL` when filtering on non-PK columns:

```sql
ALTER TABLE public.<table_name> REPLICA IDENTITY FULL;
```

### Failure Modes

All three failures produce the same delayed `system` error pattern:

```
phx_join → phx_reply status: "ok" → system status: "error"
"Unable to subscribe to changes... invalid column for filter <column>"
```

The `phx_reply: ok` is misleading — it only means the Phoenix channel accepted the join. The actual Postgres-level validation happens asynchronously. No JS error is thrown; the error only appears in WebSocket frames.

### Diagnostic Query

```sql
-- Check publication membership
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check grants for a specific table
SELECT
  has_table_privilege('anon', 'public.<table>', 'SELECT') as anon_select,
  has_table_privilege('authenticated', 'public.<table>', 'SELECT') as auth_select;

-- Check replica identity (d=default/PK, f=full, n=nothing, i=index)
SELECT relreplident FROM pg_class WHERE relname = '<table>';
```

### Current Tables

| Table | Roles | Replica Identity | Filter Column | Migration |
|---|---|---|---|---|
| `public.availability_change_event` | `authenticated`, `anon` | default (PK=`court_id`) | `court_id` | `drizzle/0044` |
| `public.chat_message` | `authenticated` | default | (none) | manual |
| `public.reservation_event` | `authenticated`, `anon` | **full** | `reservation_id` | `drizzle/0046` |
| `public.user_notification` | `authenticated` | default | (none) | `drizzle/0046` |

## Current Limitation

`place-sport` aggregate availability is not fully direct-patched from realtime.

Reason:
- those aggregate queries do not currently carry enough per-court option detail to recompute aggregate state safely from a single-court event

Result:
- court-day and court-range are fast-patched
- place-sport aggregates refetch authoritatively
