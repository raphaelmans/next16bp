# US-67-04: Player Uses Global Chat Widget On /reservations

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want a **global chat widget on my reservations pages** so that I can **message venues without having to open a specific reservation detail page**, and I can **quickly switch between my active reservation conversations**.

---

## Acceptance Criteria

### Player Sees A Floating Chat Entry On /reservations

- Given I am authenticated as a player
- When I visit `/reservations`
- Then I see a floating chat icon that opens my reservation conversations

### Widget Lists Reservation Conversations With Priority

- Given I open the chat widget
- When I have multiple reservation chats
- Then the list prioritizes:
  - Ongoing (current time between start/end)
  - Action-needed (`AWAITING_PAYMENT`)
  - Waiting for owner (`CREATED`, `PAYMENT_MARKED_BY_USER`)
  - Upcoming confirmed

### Player Can Switch Active Conversation

- Given the chat widget is open
- When I select a different reservation thread
- Then the active chat thread updates to that reservation

### Active Thread Shows Reservation Context

- Given a reservation thread is selected
- Then the thread header shows:
  - Reservation status
  - Venue/place name
  - Court label + local time range

### Archived Conversations Are Collapsed And Read-Only

- Given a reservation is `CANCELLED` or `EXPIRED`
- Then its conversation appears under an expandable "Archive" section

- Given a reservation is `CONFIRMED` and its end time is in the past
- Then its conversation appears under "Archive"

- Given I open an archived conversation
- Then the composer is disabled and the thread is read-only

### Player Can Refresh Inbox And Thread

- Given the chat widget is open
- When I click the refresh button
- Then the channel list refreshes

- Given a thread is open
- When I click refresh in the thread header
- Then the message history refreshes

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Player has no active reservation chats | Widget opens to an empty state message |
| Reservation metadata cannot be loaded | Widget still lists threads by reservation id and shows last message preview |
| Chat provider unavailable | Widget shows a clear error state |
| Reservation is cancelled/expired | Thread may still exist but is visually de-emphasized (no “active” highlight) |

---

## References

- Player reservations list: `src/app/(auth)/reservations/page.tsx`
- Player shell mount: `src/components/layout/player-shell.tsx`
- Player inbox widget: `src/features/chat/components/chat-widget/player-chat-widget.tsx`
- Thread UI: `src/features/chat/components/chat-thread/stream-chat-thread.tsx`
- Metadata hydration: `src/lib/modules/chat/reservation-chat.router.ts`
