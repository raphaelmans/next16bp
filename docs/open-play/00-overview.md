# Open Play Overview

Open Play lets a player turn a booked reservation into a joinable session so friends (or the public) can RSVP, coordinate, and play together.

The primary use case is:
- Host books first to secure a slot.
- Host shares an Open Play link to invite others.
- Players join to fill spots and (often) split/reimburse the reservation cost.

## What Open Play Is (and isn't)

Open Play is a social layer attached to an existing reservation.

- Reservation = the actual court booking with the venue.
- Open Play = a joinable event wrapper around the reservation.
- Participants join Open Play (not the reservation). The reservation remains 1:1 with the host.

KudosCourts does not process payments. Any cost-sharing is off-platform between players and the host.

## Core Rules (MVP)

### Discoverability + joinability

- Open Plays are publicly discoverable and joinable only after the underlying reservation is `CONFIRMED`.
- Before confirmation:
  - Host can view their Open Play.
  - Other users should not be able to view or join (treated as not found).

### Join policies

- `AUTO`: if a spot is available, a join request becomes `CONFIRMED` immediately.
- `REQUEST`: joiners become `REQUESTED` and the host decides.

### Capacity

- Capacity is controlled by `maxPlayers`.
- Capacity includes the host.
- A session is full when `confirmedCount >= maxPlayers`.

### Time locking

- Joining and host decisions are only allowed before the Open Play starts (`startsAt > now`).
- After start time, the Open Play becomes read-only for RSVP changes.

### Group chat

- Open Play group chat is available only when:
  - Reservation is `CONFIRMED`, and
  - Viewer is `CONFIRMED` in the Open Play (host counts), and
  - Open Play is not cancelled.

## Roles

- Host: the reservation owner; has a single `HOST` participant row.
- Player: a joiner; has a `PLAYER` participant row.

## Statuses

### Open Play status

- `ACTIVE`: upcoming and joinable (subject to join gating).
- `CLOSED`: host closed before start; no new joins.
- `CANCELLED`: reserved for future use (e.g., if reservation is cancelled); treated as unavailable.

### Participant status

- `CONFIRMED`: has a spot; gets chat access.
- `REQUESTED`: awaiting host approval.
- `WAITLISTED`: session is full.
- `DECLINED`: host declined.
- `LEFT`: participant left the session.

## Cost-sharing model (MVP)

Open Play can optionally include cost-sharing information:
- Reservation total: displayed as the base cost.
- Suggested split: computed per player (see `docs/open-play/03-cost-sharing.md`).
- Payment instructions: host-provided note/link (off-platform).

Recommendation for paid sessions:
- Host sets join policy to `REQUEST` and confirms participants after payment is received off-app.

## References

Reclub (similar model: events with RSVP + waitlist; off-platform payment guidance):
- https://reclub.co/platform/meets
- https://help.reclub.co/hc/reclub-help/articles/1765845748-how-do-payments-work-in-recub
