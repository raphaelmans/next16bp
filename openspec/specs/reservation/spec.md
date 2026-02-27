# Reservation Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Reservation domain manages the lifecycle of booking requests, payments, and cancellations. It handles the state transitions of a reservation from `CREATED` to `CONFIRMED` (or `CANCELLED`/`EXPIRED`), ensuring transactional integrity and enforcing business rules such as time-to-live (TTL) and cancellation windows.

## Data Model

Based on `src/lib/shared/infra/db/schema/reservation.ts`:

### `Reservation`
- **Identity**: `id` (UUID)
- **Foreign Keys**:
  - `courtId` (UUID) -> Court
  - `playerId` (UUID) -> Profile
  - `guestProfileId` (UUID, optional) -> GuestProfile
- **Time Range**: `startTime`, `endTime` (Timestamp with timezone)
- **Financials**: `totalPriceCents` (Integer), `currency` (VARCHAR(3))
- **Status**: `status` (Enum: `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`, `CANCELLED`, `EXPIRED`)
- **Lifecycle Timestamps**:
  - `createdAt`, `updatedAt`
  - `expiresAt` (TTL for current state)
  - `termsAcceptedAt`
  - `confirmedAt`
  - `cancelledAt`
- **Snapshots**: `playerNameSnapshot`, `playerEmailSnapshot`, `playerPhoneSnapshot` (for historical accuracy)
- **Metadata**: `cancellationReason`

### `PaymentProof`
- **Identity**: `id` (UUID)
- **Foreign Key**: `reservationId` (UUID, Unique)
- **Data**: `fileUrl`, `filePath`, `referenceNumber`, `paymentMethodId`
- **Metadata**: `notes`, `createdAt`

### `ReservationEvent` (Audit Log)
- **Identity**: `id` (UUID)
- **Foreign Key**: `reservationId` (UUID)
- **Transitions**: `fromStatus`, `toStatus`
- **Actor**: `triggeredByUserId`, `triggeredByRole`
- **Metadata**: `notes`, `createdAt`

## API & Actions

Based on `src/lib/modules/reservation/reservation.router.ts`:

### Commands (Mutations)
- **`createForCourt`**: Creates a reservation for a specific court.
  - *Input*: `CreateReservationForCourtSchema`
  - *Logic*: Validates availability, creates reservation in `CREATED` state, sets initial TTL.
- **`createForAnyCourt`**: Creates a reservation for any available court in a place.
  - *Input*: `CreateReservationForAnyCourtSchema`
  - *Logic*: Finds a suitable court, then delegates to creation logic.
- **`markPayment`**: Player marks a reservation as paid (with optional proof).
  - *Input*: `MarkPaymentSchema`
  - *Logic*: Transitions state to `PAYMENT_MARKED_BY_USER`.
- **`cancel`**: Cancels a reservation.
  - *Input*: `CancelReservationSchema`
  - *Logic*: Validates cancellation window, transitions state to `CANCELLED`.

### Queries
- **`getById`**: internal lookup by ID.
- **`getDetail`**: Detailed view with related entities.
- **`getPaymentInfo`**: Retrieval of payment instructions/status (Player view).
- **`getMy`**: List reservations for the current user.
- **`getMyWithDetails`**: List reservations with expanded details (court, place, etc.).

## Key Logic

- **Computed Availability**: The system does NOT store "slots". Availability is computed by checking court hours minus existing reservations and blocks.
- **State Machine**: Strict state transitions managed by the service layer.
- **Snapshots**: Player details are snapshotted at booking time to preserve historical records even if the profile changes.
- **Dual Identity**: Reservations can be linked to a registered `playerId` OR a `guestProfileId` (for walk-ins/admin bookings), enforced by a database check constraint.
## Requirements
### Requirement: Reservation may belong to a reservation group
The system SHALL support optional reservation grouping while preserving all existing single-reservation behavior.

#### Scenario: Legacy reservation remains valid
- **WHEN** a reservation has no group identifier
- **THEN** all existing player and owner flows behave as before

#### Scenario: Grouped reservation item
- **WHEN** a reservation is created as part of a grouped request
- **THEN** the reservation row stores a group identifier linked to its parent group

### Requirement: Grouped creation endpoint coexists with existing endpoints
The system SHALL expose grouped reservation contracts without removing or breaking existing create-for-court and create-for-any-court contracts.

#### Scenario: Existing createForCourt contract
- **WHEN** a client calls the single-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible

#### Scenario: Existing createForAnyCourt contract
- **WHEN** a client calls the any-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible

#### Scenario: Group-specific contracts are additive
- **WHEN** grouped clients use reservation-group read or payment contracts
- **THEN** those contracts are additive and keyed by `reservationGroupId`
- **AND** existing single-reservation read or payment contracts remain unchanged for non-group flows

### Requirement: Player can retrieve reservation-group detail from reservation domain contracts
The reservation domain SHALL provide a player-accessible reservation-group detail contract that returns group metadata and child reservation breakdown.

#### Scenario: Player fetches grouped reservation detail
- **WHEN** an authenticated player requests reservation-group detail for a group they own
- **THEN** the response includes reservation-group level totals, status context, and ordered child reservation items

#### Scenario: Unauthorized group access is rejected
- **WHEN** a player requests reservation-group detail for a group they do not own
- **THEN** the system rejects the request with an authorization error

### Requirement: Reservation owner operations SHALL be authorized by organization permissions
The system SHALL authorize owner-portal reservation operations for users who are either canonical owners or active members with required reservation permissions.

#### Scenario: Manager accepts reservation
- **WHEN** a user is an active member of the reservation's organization with `reservation.update_status`
- **THEN** owner reservation accept/reject/confirm-payment operations succeed

#### Scenario: Viewer blocked from mutating reservation operations
- **WHEN** a user has organization membership but lacks `reservation.update_status`
- **THEN** mutating owner reservation operations return forbidden

### Requirement: Guest booking and pending reads SHALL be permission-gated
The system SHALL gate owner guest-booking actions and owner reservation read views by explicit permissions.

#### Scenario: Manager creates guest booking
- **WHEN** an active member has `reservation.guest_booking`
- **THEN** guest booking creation and walk-in conversion operations are authorized

#### Scenario: Member without reservation.read cannot access owner reservation list
- **WHEN** an active member lacks `reservation.read`
- **THEN** owner reservation list/detail reads return forbidden

### Requirement: Reservation awaiting-owner-confirmation acceptance is validated by e2e contract
Reservation behavior for player-created bookings SHALL be covered by an e2e acceptance contract that verifies post-submit awaiting-owner-confirmation signals in UI.

#### Scenario: E2e validates CREATED-state booking confirmation
- **WHEN** a player completes a single-slot booking through the public venue booking flow
- **THEN** the acceptance test verifies reservation detail renders CREATED-state signals required for owner confirmation workflow

