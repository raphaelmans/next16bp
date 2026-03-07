## Tasks

- [x] Add database schema, repository, and migration for a dedicated `availability_change_event` realtime table.
- [x] Add a small availability change event service that records option-shaped slot/bookability events from reservation and court-block mutation paths.
- [x] Emit availability change events from reservation create/release and court-block create/cancel/update flows, including stale-expiry and walk-in conversion paths.
- [x] Add a browser realtime client and discovery-side sync hook for `availability_change_event`.
- [x] Patch court-day and court-range discovery caches directly from event payloads and invalidate aggregate place-sport caches when exact patching is not safe.
- [x] Add publication/setup support for Supabase realtime on the new availability event table.
- [x] Add targeted tests for event payload parsing, discovery cache patching, aggregate invalidation fallback, and server producer coverage.
