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

### Reservation Detail CTA Opens Matching Thread

- Given I am on reservation detail
- When I click `Message Owner` from either the status banner or actions card
- Then the chat widget opens immediately and focuses the matching reservation thread

- Given my reservation is `AWAITING_PAYMENT`
- When chat opens from the detail CTA
- Then the thread remains active (not archived/read-only) so payment coordination can continue

### Payment Page CTA Opens Matching Thread

- Given I am on `/reservations/[id]/payment`
- When I click `Message Owner`
- Then the chat widget opens immediately and focuses the matching reservation thread

### Player Sees Auto Confirmation Message

- Given the owner confirms the reservation and status becomes `CONFIRMED`
- When I open the reservation thread
- Then I see the default owner confirmation message in the thread history

### Player Sees Auto Payment-Submitted Message

- Given I submit payment and reservation status becomes `PAYMENT_MARKED_BY_USER`
- When I open the reservation thread
- Then I see the default system-generated payment-submitted message in the thread history

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
- Then the channel list and reservation metadata refresh together (status labels, archive grouping, read-only rules)

- Given a thread is open
- When I click refresh in the thread header
- Then message history and reservation metadata refresh in the same sync cycle

### Refresh Uses A Deterministic Sync State Model

- Given refresh is triggered (manual button, thread refresh, or relevant chat event)
- Then the UI transitions through a sync state model (`IDLE_SYNCED -> SYNCING_BOTH -> IDLE/PARTIAL/ERROR`)

- Given one data lane fails (messages or reservation metadata)
- Then the widget shows a partial-sync warning and allows retry without forcing the player to reselect the thread

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
