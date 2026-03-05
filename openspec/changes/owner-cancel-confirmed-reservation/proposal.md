## Why

Once a reservation reaches `CONFIRMED` status, neither the owner nor the player can cancel it. Owners need the ability to cancel confirmed bookings for legitimate reasons — double-bookings, court damage, weather closures, player no-shows, or dispute resolution. Without this, confirmed time slots are permanently locked and the only workaround is direct database manipulation. The audit trail (`reservationEvent`) already exists to track who cancelled and why, making this a safe extension of the existing state machine.

## What Changes

- Add a new `CONFIRMED -> CANCELLED` state transition triggered by organization owners/managers
- Require a cancellation reason (free text, 1-500 chars) for accountability and dispute documentation
- Create audit events recording the owner-initiated cancellation with actor identity and reason
- Notify the affected player that their confirmed booking was cancelled by the venue
- Surface cancellation in the availability studio: clicking a reservation opens a detail dialog with reservation info and a cancel action (gated by `reservation.update_status` permission)
- Support group cancellation: when a reservation belongs to a group, offer both "cancel this booking" and "cancel entire group"
- Released time slots become immediately available for new bookings (existing availability computation already excludes `CANCELLED` reservations)

## Capabilities

### New Capabilities
- `owner-cancel-confirmed-reservation`: Owner/manager ability to cancel confirmed reservations with required reason, audit trail, and player notification. Covers single and group cancellation, permission gating, and availability studio UI integration.

### Modified Capabilities
- `reservation`: The reservation state machine gains a new transition: `CONFIRMED -> CANCELLED` (owner-triggered). The `CONFIRMED` status is no longer a terminal state.
- `organization-member-rbac`: The `reservation.update_status` permission scope expands to cover cancellation of confirmed reservations (currently only gates accept/reject of pre-confirmed reservations).

## Impact

- **State machine**: `CONFIRMED` is no longer terminal. Any code assuming confirmed = permanently locked needs review (availability computation already handles this correctly since it excludes `CANCELLED`).
- **Backend**: New service method, DTO, and tRPC route on `reservation-owner` module. Follows existing `rejectReservation` pattern.
- **Frontend**: New cancel dialog component in booking studio. Timeline reservation items become clickable in the availability studio.
- **Notifications**: Reuse existing `enqueuePlayerReservationRejected` notification pipeline initially; differentiate copy in a follow-up if needed.
- **Affected files**: `reservation-owner.service.ts`, `reservation-owner.router.ts`, `reservation-owner.dto.ts`, `owner/api.ts`, `booking-studio-store.ts`, `owner-availability-week-grid.tsx`, `availability-studio-coordinator.tsx`, new `cancel-reservation-dialog.tsx`.
- **No schema migration needed**: The `reservation` table already has `cancelledAt`, `cancellationReason`, and `status` fields that support cancellation. The `reservationEvent` table already supports owner-triggered events.
- **No breaking changes**: All existing endpoints and behaviors remain unchanged.
