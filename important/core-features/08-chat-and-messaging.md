# Chat & Messaging

## Purpose

Booking a court often requires coordination — "Can I arrive 10 minutes late?", "Is parking available?", "Can you hold the court?" Chat provides a direct communication channel between the player and the venue within the context of a specific reservation.

## Reservation Chat

### How It Works

Every active reservation has a chat thread connecting the player and the venue.

- **When it activates:** The chat becomes available once a reservation is created. It auto-opens for the player on first booking confirmation.
- **Who can participate:** The player on one side, and any venue team member with "Access reservation chat" permission on the other.
- **Where it appears:**
  - **Player side:** On the reservation detail page as a chat widget.
  - **Owner side:** On the reservation detail page (click to message) and in the floating chat inbox widget (bottom-right corner of the owner portal).

### Chat Features

- Real-time messaging (powered by GetStream)
- Full message history
- Read receipts
- Typing indicators
- Media sharing support (images, files)
- Thread-based conversations (one thread per reservation)

### Availability by Reservation Status

| Status | Chat Available? |
|--------|:-:|
| CREATED | Yes |
| AWAITING_PAYMENT | Yes |
| PAYMENT_MARKED | Yes |
| CONFIRMED | Yes |
| COMPLETED | No (archived) |
| REJECTED | No |
| CANCELLED | No |

### Owner Chat Inbox Widget

A floating panel on the owner portal that aggregates all active chat threads:

- Shows unread message count
- Lists conversations with the most recent message preview
- Click to open a specific thread
- Accessible from any page in the owner portal

**Business purpose:** Owners do not need to navigate to each reservation to check for messages. The inbox widget surfaces all active conversations in one place.

## Open Play Chat

Separate from reservation chat, Open Play sessions have their own group chat:

- All participants in the session can see and send messages
- Used for coordination before and during the session
- Accessible from the Open Play detail page

## What Chat Does NOT Cover (Currently)

- **No support chat:** There is no in-app support channel for contacting KudosCourts staff. Support inquiries go through the Contact Us page.
- **No broadcast messaging:** Owners cannot send messages to all their past customers (e.g., promotions, announcements).
- **No notification for new chat messages:** New chat messages do not trigger push notifications or email alerts. The user must have the app open or check the inbox widget.
