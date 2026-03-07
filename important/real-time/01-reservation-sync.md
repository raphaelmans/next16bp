# Reservation Sync

## Canonical Identity

- `reservationId` is the canonical client identity
- linked/grouped reservations remain internal linking detail
- legacy `reservationGroupId` is boundary-only

## Sync Model

Reservation sync is centralized in:
- `src/features/reservation/sync.ts`

Main responsibilities:
- invalidate player reservation overview
- invalidate owner reservation overview
- invalidate reservation detail and linked detail
- invalidate reservation-linked chat session and thread metas
- invalidate in-app reservation notification inbox
- invalidate owner active reservation ranges when needed

## Main Consumers

- Player reservation detail/payment/list
- Owner reservations list
- Owner active reservations
- Owner reservation detail
- Owner dashboard projections
- Reservation alerts panel
- Reservation chat inbox/context
- Notification bell / in-app reservation inbox

## Hook Naming After Refactor

Examples of canonical read layers:

- `useQueryMyReservationSummaries`
- `useQueryOwnerReservationSummaries`
- `useQueryOwnerReservationEntity`
- `useQueryOwnerReservationDashboardProjection`
- `useQueryOwnerReservationAlertsProjection`

## Why Reservation Uses Event Notification

Reservation state fans out into many projections:

- summary rows
- entity detail
- linked detail
- counts
- dashboard projections
- alerts
- chat context
- notification inbox

Because of that, reservation realtime does not try to carry all derived state.
It signals change, then the client invalidates only affected canonical keys.
