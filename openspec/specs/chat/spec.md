# Chat Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Chat domain facilitates communication between players and venue owners/operators in the context of a Reservation. It leverages a third-party provider (Stream Chat) for real-time messaging, with a focus on auditability and restricted access (context-bound to specific reservations).

## Data Model

Based on `src/lib/modules/chat/` (Stream Chat integration):

### `ReservationChatSession`
- **Context**: Binds a `userId` to a `reservationId`.
- **Provider**: Stream Chat Token (JWT).
- **Metadata**: `apiKey`, `user` details (id, name, image).

### `ReservationChatThreadMeta`
- **Context**: Metadata about a specific chat channel.
- **State**: `unreadCount`, `lastMessageAt`, `previewText`.

### `TranscriptSnapshot` (Audit)
- **Purpose**: Persisted record of chat history for dispute resolution.
- **Storage**: JSON/Text dump of message history at a point in time.

## API & Actions

Based on `src/lib/modules/chat/reservation-chat.router.ts`:

### Session Management
- **`getSession`**: Authenticates a user for a specific reservation chat channel.
  - *Logic*: Validates participation (Player or Owner), issues Stream Chat token.

### Messaging
- **`sendMessage`**: Send a message to the reservation channel via backend (optional/fallback path).
- **`getThreadMetas`**: Retrieve summary data for a list of reservations (e.g., for an inbox view).

### Administration
- **`captureTranscriptSnapshot`**: Admin action to freeze chat history for audit/dispute.
- **`listTranscriptSnapshots`**: View historical snapshots.

## Key Logic

- **Context-Bound Access**: Chat is strictly scoped to a valid Reservation. Only the booking player and the venue owner (organization owner) can access the channel.
- **Provider Abstraction**: The core logic issues tokens for the client to connect directly to Stream Chat, minimizing backend load for real-time message delivery.
- **Auditability**: Since chat happens on a third-party service, the `captureTranscriptSnapshot` feature allows admins to pull history into the primary database for permanent record keeping during disputes.

## Requirements

### Requirement: Grouped reservations use group chat thread contracts
The chat domain SHALL support reservation-group thread/session/message contracts so grouped bookings can be handled in one shared conversation.

#### Scenario: Group session is issued for grouped booking
- **WHEN** a player or owner opens chat from a grouped reservation flow
- **THEN** the system issues chat session metadata for a reservation-group thread keyed by `reservationGroupId`
- **AND** the session includes only participants authorized for that grouped booking context

#### Scenario: Group message uses group thread identity
- **WHEN** a participant sends a message from a grouped reservation chat surface
- **THEN** the message is posted to the reservation-group thread identity
- **AND** the message is not fan-out duplicated across separate per-item reservation threads

### Requirement: Single-reservation chat compatibility is preserved
The chat domain SHALL keep existing reservation-level session and messaging contracts functional for non-grouped reservations and legacy entry points.

#### Scenario: Single reservation chat remains unchanged
- **WHEN** a user opens chat for a non-grouped reservation
- **THEN** the system continues using reservation-level chat contracts and identity semantics

#### Scenario: Historical reservation thread remains accessible
- **WHEN** a user accesses existing reservation-level chat history created before group-thread handling
- **THEN** the thread remains accessible under existing authorization and read-only rules

### Requirement: Reservation chat owner-side access SHALL include authorized organization members
The reservation chat boundary SHALL allow owner-side participation by active organization members with chat permission.

#### Scenario: Manager joins reservation chat
- **WHEN** an active organization member with `reservation.chat` requests reservation chat session
- **THEN** chat session creation succeeds
- **AND** the member is included in reservation chat participants

#### Scenario: Member without chat permission blocked
- **WHEN** an active organization member lacks `reservation.chat`
- **THEN** reservation chat session/message operations return forbidden
