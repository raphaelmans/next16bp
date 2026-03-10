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

## Operational Requirement

Every table subscribed via Supabase Realtime depends on these environment-side requirements:

- the table must be present in the `supabase_realtime` publication
- subscribing roles must have `SELECT` on the table
- if the subscription uses a column filter (e.g. `reservation_id=eq.<id>`), the filter column must be in the WAL output — tables with `REPLICA IDENTITY DEFAULT` only expose PK columns; set `REPLICA IDENTITY FULL` when filtering on non-PK columns

Without the `SELECT` grant, Supabase Realtime can accept `phx_join` and still emit a delayed `system` error like `invalid column for filter <column>`. The same error occurs when filtering on a column not present in the replica identity.

The browser Supabase client connects with the publishable key, which maps to the `anon` role. Tables using column filters must grant `SELECT` to `anon` so the filter validation function (`realtime.subscription_check_filters`) can verify column access via `has_column_privilege`. Tables without filters (e.g. `user_notification`) only need `authenticated` since the filter validation loop is skipped.

Tables and required grants:

| Table | Roles | Publication + Grant migration |
|---|---|---|
| `public.availability_change_event` | `authenticated`, `anon` | `drizzle/0044_availability_change_event_realtime_grants.sql` |
| `public.chat_message` | `authenticated` | (added manually to publication) |
| `public.reservation_event` | `authenticated`, `anon` | `drizzle/0046_reservation_notification_realtime_grants.sql` |
| `public.user_notification` | `authenticated` | `drizzle/0046_reservation_notification_realtime_grants.sql` |

## Current Limitation

`place-sport` aggregate availability is not fully direct-patched from realtime.

Reason:
- those aggregate queries do not currently carry enough per-court option detail to recompute aggregate state safely from a single-court event

Result:
- court-day and court-range are fast-patched
- place-sport aggregates refetch authoritatively
