# US-67-02: Owner Uses Inbox To Reply Across Reservations

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **view and reply to reservation messages in a single inbox** so that **I can manage conversations across my venues without hunting through individual reservation pages**.

---

## Acceptance Criteria

### Owner Has A Persistent Inbox Entry Point

- Given I am authenticated as an owner
- When I navigate across owner pages
- Then I can open an inbox that shows reservation conversations

### Inbox Shows Recent Conversations And Unread Count

- Given I have reservation conversations
- When I open the inbox
- Then I see a list of conversations sorted by recent activity

- Given I have unread messages
- When I view the inbox entry point
- Then I see an unread count badge

### Owner Can Search Conversations

- Given the inbox is open
- When I search by reservation identifier or message text
- Then the conversation list filters to matching conversations

### Owner Can Select A Conversation And Reply

- Given the inbox is open
- When I select a conversation
- Then I see the conversation thread

- Given I am viewing a conversation thread
- When I send a message
- Then it appears in the thread

### Archived Conversations Are Collapsed And Read-Only

- Given a reservation is `CANCELLED` or `EXPIRED`
- Then its conversation appears under an expandable "Archive" section

- Given a reservation is `CONFIRMED` and its end time is in the past
- Then its conversation appears under "Archive"

- Given I open an archived conversation
- Then the composer is disabled and the thread is read-only

### Owner Can Refresh Inbox And Thread

- Given the inbox is open
- When I click the refresh button
- Then the channel list and labels refresh

- Given a thread is open
- When I click refresh in the thread header
- Then the message history refreshes

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| There are no reservation conversations | Inbox shows an empty state |
| Owner loses chat connectivity | Inbox shows a clear error state |
| Conversation references a reservation the owner should not access | It is not shown or its details are omitted |

---

## References

- Layout mount: `src/app/(owner)/layout.tsx`
- Inbox widget UI: `src/features/chat/components/chat-widget/owner-chat-widget.tsx`
- Owner auth/session: `src/lib/modules/chat/chat.router.ts`
- Reservation labels for inbox: `src/lib/modules/chat/reservation-chat.router.ts`
