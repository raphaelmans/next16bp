# Chat & Messaging (Operational Reference)

_Supporting operational reference. Read after the primary reservation doc in [00-overview.md](./00-overview.md)._

## Purpose

Chat supports the coordination work that happens after a reservation exists: confirmation questions, payment follow-up, and scheduling details between the player and the venue.

## Provider Model

The chat model is provider-backed, but the runtime is configurable. The current factory defaults to Supabase unless `CHAT_PROVIDER` is explicitly set to another supported backend.

## Reservation Chat

Reservation chat is the main operational thread type.

Current shape:

- one thread per eligible reservation
- player on one side
- owner-side team members with `reservation.chat` on the other
- available from reservation detail flows and the owner reservation inbox widget

Current capabilities that are clearly represented in the active stack:

- real-time message delivery
- attachments/media support
- unread-count and mark-read behavior
- owner inbox aggregation across reservation threads

Current constraints:

- guest bookings do not get reservation chat support
- typing indicators and read-receipt UI are not part of the active documented experience

## Open Play Chat

Open Play sessions use their own thread type for confirmed participants and hosts. This is separate from reservation chat.

## What Chat Does Not Cover

- no in-app support chat with KudosCourts staff
- no owner broadcast messaging to all customers
- no separately documented chat-specific push/email alert layer
