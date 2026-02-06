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

### Reservation Detail Includes A Direct Chat CTA

- Given I am viewing reservation detail
- When the reservation status is one of: `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`
- Then I see direct `Message Owner` entry points that open the chat widget to this reservation thread:
  - top status banner action
  - reservation actions card action

- Given my reservation is `AWAITING_PAYMENT`
- When I click `Message Owner`
- Then chat opens immediately and stays interactive so I can coordinate payment details with the venue

### Chat Is Restricted To Reservation Participants

- Given I am authenticated
- When I am not a participant of the reservation
- Then I cannot access the reservation chat

### Confirmation Auto-Opens Chat Once

- Given my reservation becomes `CONFIRMED`
- When I view the reservation page
- Then the chat panel auto-opens once (and does not repeatedly auto-open on subsequent reloads)

### Confirmation Seeds A Default Owner Message

- Given a reservation transitions to `CONFIRMED` through an owner confirmation action
- When either participant opens the reservation thread
- Then a default owner confirmation message appears in the thread history

- Given confirmation is retried or the UI reloads
- Then the default owner confirmation message is posted only once

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

- UI: `src/features/chat/components/chat-widget/player-chat-widget.tsx`
- Reservation detail CTA: `src/features/reservation/components/reservation-actions-card.tsx`
- Widget open/focus orchestration: `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`
- Thread UI: `src/features/chat/components/chat-thread/stream-chat-thread.tsx`
- Session/auth: `src/lib/modules/chat/reservation-chat.router.ts`
- Server rules: `src/lib/modules/chat/services/reservation-chat.service.ts`
