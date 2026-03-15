# US-67-03: Admin Captures Reservation Chat Transcript Snapshot

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **capture an immutable snapshot of a reservation chat transcript** so that **support and disputes can rely on durable evidence even if the live conversation changes later**.

---

## Acceptance Criteria

### Admin Can Capture A Transcript Snapshot

- Given I am authenticated as an admin
- When I request a transcript snapshot for a reservation
- Then the platform stores a new transcript snapshot for that reservation

### Snapshot Is Append-Only And Historical

- Given a reservation already has one or more transcript snapshots
- When I capture another snapshot
- Then the previous snapshots remain available and unchanged

### Snapshot Includes Messages And Attachment Metadata

- Given the reservation has chat messages
- When I capture a transcript snapshot
- Then the snapshot includes the messages and any attachment metadata needed to review the conversation

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Reservation does not exist | Snapshot capture fails with a clear not-found error |
| Reservation is a guest booking | Snapshot capture is not supported |
| Chat provider is unavailable | Snapshot capture fails with a clear error and can be retried later |

---

## References

- Router: `src/lib/modules/chat/reservation-chat.router.ts`
- Service: `src/lib/modules/chat/services/reservation-chat.service.ts`
- Provider export: `src/lib/modules/chat/providers/stream-chat.provider.ts`
- DB schema: `src/lib/shared/infra/db/schema/reservation-chat.ts`
