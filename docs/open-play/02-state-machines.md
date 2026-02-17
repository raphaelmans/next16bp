# Open Play State Machines

These diagrams describe observable behavior for users.

## 1) Reservation -> Open Play publish gating

Open Play is attached to a reservation. Publication is derived from reservation confirmation.

```mermaid
stateDiagram-v2
  [*] --> HiddenDraft: Open Play created

  HiddenDraft --> Published: reservation CONFIRMED
  HiddenDraft --> Dead: reservation CANCELLED/EXPIRED

  Published --> Closed: host closes (before startsAt)
  Published --> Locked: startsAt <= now
  Published --> Dead: reservation CANCELLED/EXPIRED

  Closed --> Locked: startsAt <= now
  Locked --> [*]
```

Notes:
- HiddenDraft: host can see; others should receive NOT_FOUND.
- Published: can appear in venue list (if `PUBLIC`) and accept joins.
- Locked: joining/moderation locked once the session starts.

## 2) Open Play status

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> CLOSED: host closes
  ACTIVE --> CANCELLED: reservation cancelled (future)
  CLOSED --> [*]
  CANCELLED --> [*]
```

MVP behavior:
- `CANCELLED` is treated as unavailable.

## 3) Participant RSVP lifecycle

```mermaid
stateDiagram-v2
  [*] --> None

  None --> Confirmed: AUTO + capacity
  None --> Requested: REQUEST + capacity
  None --> Waitlisted: full

  Requested --> Confirmed: host CONFIRM
  Requested --> Waitlisted: host WAITLIST
  Requested --> Declined: host DECLINE

  Waitlisted --> Confirmed: host CONFIRM (spot)
  Waitlisted --> Declined: host DECLINE

  Confirmed --> Left: player LEAVE
  Requested --> Left: player LEAVE
  Waitlisted --> Left: player LEAVE
  Declined --> Left: player LEAVE
```

## 4) Chat access gating

```mermaid
flowchart TD
  A[User opens Open Play] --> B{Reservation CONFIRMED?}
  B -- No --> X[No chat; detail may be hidden]
  B -- Yes --> C{Participant status CONFIRMED
  or role HOST?}
  C -- No --> Y[No chat]
  C -- Yes --> Z[Chat available]
```
