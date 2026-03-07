# Real-Time Testing

## Testing Standard

Realtime availability unit testing follows:
- `guides/client/core/testing.md`

Applied rules:
- mirrored `src/__tests__/` layout
- AAA test structure
- fake/stub boundaries
- no live DB / websocket / network infra

## Main Test Coverage Added

### Common

- `src/__tests__/common/query-keys/availability.test.ts`
  - stable scope normalization
  - addon ordering

- `src/__tests__/common/clients/availability-realtime-client.test.ts`
  - valid payload forwarding
  - invalid payload rejection
  - scope filter selection
  - unsubscribe behavior

### Discovery

- `src/__tests__/features/discovery/hooks/availability-query-hooks.test.ts`
  - normalized hook input
  - focus/reconnect recovery config

- `src/__tests__/features/discovery/realtime.test.ts`
  - direct court-cache patch
  - aggregate invalidation fallback

### Owner Availability

- `src/__tests__/features/owner/hooks/availability-sync.test.ts`
  - optimistic block append/replace/remove
  - range update helper behavior
  - owner reservation-range realtime invalidation

### Server

- `src/__tests__/lib/modules/availability/services/availability-change-event.service.test.ts`
  - event payload shaping for booked slot emission

## Reservation-Adjacent Regression Net

Related tests also cover the shared sync foundation:

- `src/__tests__/features/reservation/sync.test.ts`
- `src/__tests__/features/reservation/hooks.test.ts`
- `src/__tests__/features/notifications/components/notification-bell.test.tsx`
- `src/__tests__/features/chat/components/chat-widget/reservation-inbox-widget.test.tsx`

## What Is Still Not Covered By Unit Tests

- full browser e2e cross-tab propagation
- real DB migration + Supabase realtime publication verification
- full aggregate place-sport direct patching, because that path still refetches by design
