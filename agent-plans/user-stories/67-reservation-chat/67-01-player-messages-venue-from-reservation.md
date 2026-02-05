# US-67-01: Player Messages Venue From Reservation

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **message the venue owner about my reservation** so that **we can coordinate details (timing, access, questions) without leaving the platform**.

---

## Acceptance Criteria

### Chat Is Available Only For Active Reservation States

- Given I am viewing my reservation
- When the reservation status is one of: `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`
- Then I can open a chat panel for that reservation

- Given I am viewing my reservation
- When the reservation status is not in the active list
- Then I do not see reservation chat

### Chat Is Restricted To Reservation Participants

- Given I am authenticated
- When I am not a participant of the reservation
- Then I cannot access the reservation chat

### Confirmation Auto-Opens Chat Once

- Given my reservation becomes `CONFIRMED`
- When I view the reservation page
- Then the chat panel auto-opens once (and does not repeatedly auto-open on subsequent reloads)

### Player Can Send Text And Attachments

- Given the chat panel is open
- When I send a text message
- Then the message appears in the conversation thread

- Given the chat panel is open
- When I attach one or more files and send
- Then the attachments appear in the conversation thread

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Reservation is a guest booking (no player account) | Chat is unavailable and a clear message is shown |
| Chat service is unavailable or not configured | Player sees a clear error state and cannot send messages |
| Player tries to send an empty message (no text, no attachments) | Nothing is sent |
| Attachment upload fails | Player sees an error and can retry |

---

## References

- UI: `src/features/chat/components/chat-widget/player-reservation-chat-widget.tsx`
- Thread UI: `src/features/chat/components/chat-thread/stream-chat-thread.tsx`
- Session/auth: `src/lib/modules/chat/reservation-chat.router.ts`
- Server rules: `src/lib/modules/chat/services/reservation-chat.service.ts`
