# Open Play (Operational Reference)

_Supporting operational reference. Read after the primary player booking doc in [00-overview.md](./00-overview.md)._

## Purpose

Open Play is the social layer on top of reservations. It lets a player turn a confirmed booking into a joinable session that other players can discover and request to join.

## Verified Open Play Flow

The verified/internal flow is reservation-backed, not standalone:

1. A player creates a regular reservation or reservation group.
2. The host creates Open Play from that reservation context.
3. The Open Play becomes visible and joinable only after the underlying reservation is confirmed.

Key constraint:

- the verified host flow is tied to the reservation player's profile

## External Open Play Flow

There is also a separate external flow for sessions that originate outside KudosCourts.

Current characteristics:

- created independently from a KudosCourts reservation
- labeled as external/unverified
- shown separately from verified Open Plays
- can be promoted later into a verified Open Play flow

## Listing Surface

The public Open Play listing is currently venue-specific, not a global `/open-play` index.

Players browse:

- verified Open Plays for a place
- external Open Plays for the same place

## Joining And Session Management

Once a session is active, the product supports:

- join requests
- host approval or rejection
- participant leave flows
- close or cancel actions
- session chat for eligible participants

## Reporting Reality

External Open Plays currently have a reporting path. An equivalent internal verified-player reporting flow is not documented in the current implementation.

## Business Value

- players can split cost and find others to play with
- venues can fill more court time
- the platform gets a social layer that can drive repeat activity
