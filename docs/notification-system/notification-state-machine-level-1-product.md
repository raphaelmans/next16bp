# Notification State Machine - Level 1 Product Narrative

## Narrative

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

### Delivery guarantees
- Notifications are delivered **asynchronously** using an outbox job queue.
- Vendor outages do not block owner workflows.
- Jobs are retried with exponential backoff before giving up.

### Browser notifications (Web Push)
- When a user enables browser notifications, the platform can deliver short, Facebook-like notifications via the browser notification UI.
- If a user has not enabled notifications (no push subscription), the underlying event still succeeds but no browser notification is sent.

### Admin experience
- Notifications include a direct link to the review screen:
  - `/admin/verification/[requestId]`
