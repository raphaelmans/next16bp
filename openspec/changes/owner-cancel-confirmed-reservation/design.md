## Context

The reservation state machine currently treats `CONFIRMED` as a terminal state. Players can cancel pre-confirmed reservations (via `reservation.cancel`), and owners can reject pre-confirmed reservations (via `reservationOwner.reject`), but once confirmed — no cancellation path exists. This blocks legitimate operational needs: double-bookings, court closures, dispute resolution, no-shows.

The existing architecture already supports this change well:
- `reservationEvent` audit table tracks all state transitions with actor, role, and notes
- `reservation` table has `cancelledAt`, `cancellationReason` fields
- Availability computation already excludes `CANCELLED` reservations (time slots auto-released)
- `rejectReservation` in `reservation-owner.service.ts` (line 1131) provides the exact pattern to follow
- `reservation.update_status` permission already gates owner mutation actions

**Constraints:**
- No schema migration needed — all required columns exist
- Must not break existing reject flow (separate endpoint, separate semantic)
- Must maintain full audit trail for dispute resolution

## Goals / Non-Goals

**Goals:**
- Allow owners/managers to cancel `CONFIRMED` reservations with a required reason
- Support both single and group cancellation
- Full audit trail via `reservationEvent` with `triggeredByRole: "OWNER"`
- Player notification when their confirmed booking is cancelled
- Availability studio UI: click reservation → detail dialog → cancel action
- Permission-gated by `reservation.update_status`

**Non-Goals:**
- Automated refunds (manual process, reason documented in audit log)
- Cancelling pre-confirmed reservations via this endpoint (existing `reject` handles those)
- Stream Chat channel cleanup on cancellation (follow-up)
- Differentiated notification templates for "cancelled" vs "rejected" copy (reuse rejected notification initially)
- Player-side cancellation of confirmed reservations (out of scope)

## Decisions

### 1. Separate `cancel` endpoint vs extending `reject`

**Decision:** New `cancelReservation` / `cancelReservationGroup` methods and tRPC routes.

**Rationale:** "Reject" means declining a pending request. "Cancel" means revoking an accepted booking. They have different:
- Source statuses (`reject` = pre-confirmed, `cancel` = CONFIRMED only)
- Audit semantics (event notes: "Rejected by owner" vs "Cancelled by owner")
- Logger events (`reservation.rejected` vs `reservation.cancelled_by_owner`)
- Future potential: cancellation may eventually trigger refund flows that rejection never would

**Alternative considered:** Extending `reject` to accept CONFIRMED status. Rejected because it muddies the semantic distinction and makes audit logs harder to interpret for dispute resolution.

### 2. Status gate: CONFIRMED only

**Decision:** The cancel endpoint only accepts reservations in `CONFIRMED` status.

**Rationale:** Pre-confirmed states are already handled by `reject`. Having one clear action per state range avoids confusion. The UI can show the appropriate action based on current status.

### 3. Notification: reuse `enqueuePlayerReservationRejected` initially

**Decision:** Reuse the existing rejected notification pipeline for the first iteration.

**Rationale:** The payload shape is identical (reservationId, placeName, courtLabel, startTime, endTime, reason). Creating a separate `enqueuePlayerReservationCancelledByOwner` event type is a follow-up to differentiate the player-facing copy. This keeps scope minimal.

**Alternative considered:** New notification event type from day one. Deferred because it requires changes to the notification rendering pipeline (inbox, push templates) which is orthogonal to the core feature.

### 4. UI: reservation detail dialog with cancel action

**Decision:** Clicking a reservation in the availability studio timeline opens a `Dialog` (not `AlertDialog`) showing reservation details and a cancel form with required reason textarea.

**Rationale:** A dialog (vs context menu) provides space for reservation details, the reason field, and group actions. Follows the pattern of `RemoveBlockDialog` for court blocks. The `ReservationItem` type in the booking studio store needs `groupId` added to support group detection.

### 5. Store: full `ReservationItem` object, not just ID

**Decision:** Store `selectedReservation: ReservationItem | null` in the booking studio zustand store.

**Rationale:** The dialog needs to display reservation details (player name, time, price, status, group membership) immediately without an extra fetch. Follows the same pattern as block management where the full object is passed around.

## Risks / Trade-offs

- **[Risk] Owner cancels confirmed booking maliciously** → Mitigated by required reason field, full audit trail in `reservationEvent`, and `reservation.update_status` permission gating. Organization owner can review audit logs.
- **[Risk] Race condition: two owners cancel same reservation** → Mitigated by `findByIdForUpdate` (row-level locking in transaction), same pattern as existing `rejectReservation`.
- **[Risk] Notification copy says "rejected" for cancelled bookings** → Acceptable for v1. The notification includes the reason text which provides context. Follow-up to differentiate templates.
- **[Trade-off] No automated refund** → Deliberate. Refund policy varies per venue. The cancellation reason + audit log serves as documentation for manual refund processing.
