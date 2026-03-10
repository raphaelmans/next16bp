# Real-Time Source Files

## Shared Query/Sync

- `src/common/query-keys/shared.ts`
- `src/common/query-keys/reservation.ts`
- `src/common/query-keys/availability.ts`
- `src/features/reservation/sync.ts`
- `src/features/owner/hooks/availability-sync.ts`

## Realtime Clients

- `src/common/clients/reservation-realtime-client/index.ts`
- `src/common/clients/availability-realtime-client/index.ts`

## Discovery Consumers

- `src/features/discovery/realtime.ts`
- `src/features/discovery/hooks/search.ts`
- `src/features/discovery/hooks/place-detail.ts`
- `src/features/discovery/place-detail/hooks/use-next-week-prefetch.ts`
- `src/features/discovery/place-detail/hooks/use-mobile-week-prefetch.ts`

## Owner Consumers

- `src/features/owner/pages/owner-reservations-page.tsx`
- `src/features/owner/pages/owner-active-reservations-page.tsx`
- `src/features/owner/pages/owner-dashboard-page.tsx`
- `src/features/owner/pages/owner-reservation-detail-page.tsx`
- `src/features/owner/components/reservation-alerts-panel.tsx`
- `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx`
- `src/features/owner/components/place-court-availability/place-court-availability-coordinator.tsx`

## Notification and Chat Consumers

- `src/features/notifications/components/notification-bell.tsx`
- `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`

## Server Availability Event Flow

- `src/lib/shared/infra/db/schema/availability-change-event.ts`
- `src/lib/modules/availability/repositories/availability-change-event.repository.ts`
- `src/lib/modules/availability/services/availability-change-event.service.ts`
- `src/lib/modules/availability/factories/availability-change-event.factory.ts`
- `src/lib/modules/reservation/services/reservation.service.ts`
- `src/lib/modules/reservation/services/reservation-owner.service.ts`
- `src/lib/modules/reservation/use-cases/expire-stale-reservations.use-case.ts`
- `src/lib/modules/court-block/services/court-block.service.ts`

## Supporting Scripts and Migrations

- `drizzle/0039_availability_change_event.sql`
- `drizzle/0044_availability_change_event_realtime_grants.sql`
- `drizzle/0046_reservation_notification_realtime_grants.sql`
- `scripts/enable-realtime-availability-change-events.ts`

## OpenSpec Changes

- `openspec/changes/reservation-first-realtime-optimization/`
- `openspec/changes/availability-changed-realtime-event/`
- `openspec/changes/availability-realtime-unit-tests/`
