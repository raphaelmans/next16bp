# Notification State Machine - Level 1 Product Narrative

## Narrative

All currently supported business event types are listed in [notification-event-catalog.md](./notification-event-catalog.md).

### Venue verification (admin notifications)
- An owner submits a venue verification request.
- The request is saved immediately; the owner sees a success state.
- Admins receive notifications shortly after:
  - Email with place name, organization, and review link.
  - SMS when a phone number exists for the admin profile.
- If an admin lacks a phone number, they still receive email.
- If no admin contact details exist, the request still succeeds but no notification is sent.

### Reservation created (owner notifications)
- A player completes a reservation.
- The reservation is saved immediately; the player sees a success state.
- Court owners receive notifications shortly after:
  - Email with reservation details and a link to review.
  - SMS when an owner phone number exists.
- If no owner contact details exist, the reservation still succeeds but no notification is sent.

### Verification decisions (owner notifications)
- When admins approve or reject a verification request, the owner is notified.
- When admins approve or reject a claim request, the owner is notified.
- Messages include the venue name and a link back to owner pages.

### Reservation lifecycle updates (player and owner notifications)
- When an owner accepts a paid reservation, the player can receive a browser notification that payment is needed.
- When a player marks payment, the owner can receive a browser notification.
- When an owner confirms or rejects a reservation, the player can receive a browser notification.
- When a player cancels a reservation, the owner can receive a browser notification.

### Delivery guarantees
- Notifications are delivered **asynchronously** using an outbox job queue.
- Vendor outages do not block owner workflows.
- Jobs are retried with exponential backoff before giving up.
- Most enqueue paths are transaction-coupled, while some reservation lifecycle notifications use best-effort enqueue with warning logs.

### Browser notifications (Web Push)
- When a user enables browser notifications, the platform can deliver short browser/OS notifications.
- If a user has not enabled notifications (no push subscription), the underlying event still succeeds but no browser notification is sent.

### Admin experience
- Notifications include a direct link to the review screen:
  - `/admin/verification/[requestId]`
