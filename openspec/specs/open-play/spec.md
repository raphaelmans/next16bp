# Open Play Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Open Play domain allows players to create public or semi-private game sessions attached to a Reservation. This feature transforms a standard court booking into a social event where other players can request to join, facilitating community building and cost/effort sharing.

## Data Model

Based on `src/lib/shared/infra/db/schema/open-play.ts`:

### `OpenPlay`
- **Identity**: `id`
- **Reservation**: `reservationId` (1:1, Unique)
- **Host**: `hostProfileId`
- **Location**: `placeId`, `courtId`, `sportId`
- **Schedule**: `startsAt`, `endsAt`
- **Config**:
  - `status`: `ACTIVE`, `FULL`, `CANCELLED`, `CLOSED`
  - `visibility`: `PUBLIC`, `PRIVATE`
  - `joinPolicy`: `REQUEST` (Host approves), `AUTO` (Instant join)
  - `maxPlayers`: Cap on participants
- **Metadata**: `title`, `note`, `paymentInstructions`, `paymentLinkUrl`

### `OpenPlayParticipant`
- **Identity**: `id`, `openPlayId`
- **Player**: `profileId`
- **State**:
  - `role`: `HOST`, `PLAYER`
  - `status`: `REQUESTED`, `CONFIRMED`, `REJECTED`, `LEFT`, `REMOVED`
- **Audit**: `decidedAt`, `decidedByProfileId`

## API & Actions

Based on `src/lib/modules/open-play/open-play.router.ts`:

### Discovery
- **`listByPlace`**: Find upcoming public games at a specific venue.
- **`getPublicDetail`**: View game details (roster, rules) before joining.

### Management (Host)
- **`createFromReservation`**: Turn an existing reservation into an Open Play session.
- **`decideParticipant`**: Accept or reject a join request.
- **`close`**: Stop accepting new requests.
- **`cancel`**: Cancel the Open Play session (does not necessarily cancel the reservation, but usually linked).

### Participation (Player)
- **`requestToJoin`**: Submit a request to join a game.
- **`leave`**: Withdraw from a game.
- **`getForReservation`**: Check if a reservation has an associated Open Play.

## Key Logic

- **Reservation Dependency**: An Open Play session *must* be backed by a valid Reservation. If the reservation is cancelled, the Open Play session is typically invalidated (though logic may vary on exact state transitions).
- **Roster Management**: Tracks `maxPlayers` and prevents overbooking.
- **Join Policy**: Supports both "Open" (Auto-join) and "Moderated" (Host-approval) workflows.
- **Chat Integration**: (Implied) Confirmed participants likely get access to a group chat for the session.
