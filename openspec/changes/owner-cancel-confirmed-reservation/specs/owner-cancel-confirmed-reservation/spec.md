## ADDED Requirements

### Requirement: Owner SHALL cancel a confirmed reservation with a required reason
The system SHALL allow an authorized organization member to cancel a reservation in `CONFIRMED` status by providing a cancellation reason (1-500 characters). The reservation SHALL transition to `CANCELLED` status, releasing the time slot for new bookings.

#### Scenario: Owner cancels a confirmed reservation
- **WHEN** an authorized owner/manager submits a cancel request for a reservation in `CONFIRMED` status with reason "Court damaged by storm"
- **THEN** the reservation status transitions to `CANCELLED`
- **AND** `cancelledAt` is set to the current timestamp
- **AND** `cancellationReason` is set to the provided reason
- **AND** `expiresAt` is set to null

#### Scenario: Owner attempts to cancel a non-confirmed reservation
- **WHEN** an owner submits a cancel request for a reservation in `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CANCELLED`, or `EXPIRED` status
- **THEN** the system rejects the request with an invalid status error
- **AND** the reservation remains unchanged

#### Scenario: Cancel request with missing or empty reason
- **WHEN** an owner submits a cancel request without a reason or with an empty string
- **THEN** the system rejects the request with a validation error

#### Scenario: Cancel request for non-existent reservation
- **WHEN** an owner submits a cancel request for a reservation ID that does not exist
- **THEN** the system returns a not-found error

### Requirement: Owner SHALL cancel all reservations in a confirmed group
The system SHALL allow an authorized organization member to cancel all reservations in a reservation group by providing the group ID and a cancellation reason. All `CONFIRMED` reservations in the group SHALL transition to `CANCELLED`.

#### Scenario: Owner cancels entire reservation group
- **WHEN** an authorized owner/manager submits a group cancel request with reason "Double-booked event"
- **THEN** all `CONFIRMED` reservations in the group transition to `CANCELLED`
- **AND** each reservation gets `cancelledAt`, `cancellationReason` set individually
- **AND** an audit event is created for each reservation in the group

#### Scenario: Group contains mixed statuses
- **WHEN** a reservation group contains reservations in both `CONFIRMED` and `CANCELLED` statuses
- **THEN** the system rejects the request with an invalid status error for the non-confirmed reservation
- **AND** no reservations in the group are modified (atomic transaction)

### Requirement: Owner cancellation SHALL create an audit event
The system SHALL record every owner-initiated cancellation as a `reservationEvent` with complete traceability.

#### Scenario: Audit event created for single cancellation
- **WHEN** an owner cancels a confirmed reservation
- **THEN** a `reservationEvent` is created with `fromStatus: "CONFIRMED"`, `toStatus: "CANCELLED"`, `triggeredByRole: "OWNER"`, `triggeredByUserId` set to the acting user, and `notes` containing "Cancelled by owner: {reason}"

#### Scenario: Audit event created for group cancellation
- **WHEN** an owner cancels a reservation group
- **THEN** a `reservationEvent` is created for each reservation in the group with `triggeredByRole: "OWNER"` and notes indicating group cancellation

### Requirement: Player SHALL be notified when their confirmed booking is cancelled by owner
The system SHALL notify the affected player when an owner cancels their confirmed reservation.

#### Scenario: Player receives cancellation notification
- **WHEN** an owner cancels a confirmed reservation belonging to a registered player
- **THEN** the system enqueues a notification to the player containing the place name, court label, time range, and cancellation reason

#### Scenario: Guest booking cancellation skips player notification
- **WHEN** an owner cancels a confirmed guest booking (no registered player)
- **THEN** no player notification is enqueued
- **AND** the cancellation still succeeds with full audit trail

### Requirement: Cancelled confirmed reservation SHALL release time slot for availability
The system SHALL ensure that a cancelled confirmed reservation no longer blocks the time slot in availability computation.

#### Scenario: Time slot becomes available after cancellation
- **WHEN** a confirmed reservation occupying 2:00-3:00 PM is cancelled by the owner
- **THEN** the 2:00-3:00 PM slot is immediately available for new bookings
- **AND** the availability studio timeline no longer displays the reservation as active

### Requirement: Availability studio SHALL display reservation details on click
The availability studio timeline SHALL allow organization members to click on a reservation to view its details in a dialog.

#### Scenario: Owner clicks a confirmed reservation in the timeline
- **WHEN** an owner clicks a reservation item in the availability studio week grid
- **THEN** a dialog opens showing: player name, time range, court, status badge, and price
- **AND** a "Cancel Booking" action with a required reason field is available

#### Scenario: Owner clicks a non-confirmed reservation
- **WHEN** an owner clicks a reservation in `CREATED` or `AWAITING_PAYMENT` status
- **THEN** the dialog opens showing reservation details
- **AND** the cancel action is not available (use existing reject flow for pre-confirmed states)

#### Scenario: Group reservation shows group actions
- **WHEN** an owner clicks a reservation that belongs to a group
- **THEN** the dialog indicates group membership
- **AND** offers both "Cancel This Booking" and "Cancel Entire Group" actions

### Requirement: Cancel action SHALL be gated by reservation.update_status permission
Only organization members with `reservation.update_status` permission SHALL see and execute the cancel action.

#### Scenario: Manager with permission cancels reservation
- **WHEN** an active organization member with `reservation.update_status` permission submits a cancel request
- **THEN** the cancellation succeeds

#### Scenario: Viewer without permission attempts cancellation
- **WHEN** an organization member without `reservation.update_status` permission submits a cancel request
- **THEN** the system returns a forbidden error

#### Scenario: Non-member attempts cancellation
- **WHEN** a user who is not a member of the reservation's organization submits a cancel request
- **THEN** the system returns a forbidden error
