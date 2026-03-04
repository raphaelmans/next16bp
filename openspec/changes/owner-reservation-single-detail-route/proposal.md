## Why

Grouped owner reservations currently route to two different detail pages (`/organization/reservations/:id` and `/organization/reservations/group/:groupId`) depending on entry point (tables, alerts, detail CTA, notifications). This creates inconsistent UX and duplicate handling surfaces for the same operational task.

## What Changes

- Standardize grouped owner booking navigation to a single canonical detail route: `/organization/reservations/:representativeReservationId`.
- Retain `/organization/reservations/group/:groupId` as a backward-compatible URL that redirects to the canonical single-detail route.
- Normalize grouped owner lifecycle notification deep links to the canonical single-detail route using `representativeReservationId`.
- Remove owner UI affordances that intentionally navigate to the standalone group detail page.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `reservation-group-booking`: Owner-side grouped booking navigation requirements are updated to use a canonical single-detail route and legacy route compatibility redirect.
- `reservation-group-notification-delivery`: Owner-side grouped lifecycle notification routing requirements are updated to deep-link to canonical single-detail routes.

## Impact

- Affected owner route behavior in `src/app/(owner)/organization/reservations/group/[groupId]/page.tsx`.
- Affected owner grouped-notification link generation in `src/lib/modules/notification-delivery/shared/domain.ts`.
- Affected owner reservation detail UI in `src/features/owner/pages/owner-reservation-detail-page.tsx`.
- No tRPC contract changes and no database schema changes.
