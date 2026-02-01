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

### Delivery guarantees
- Notifications are delivered **asynchronously** using an outbox job queue.
- Vendor outages do not block owner workflows.
- Jobs are retried with exponential backoff before giving up.

### Admin experience
- Notifications include a direct link to the review screen:
  - `/admin/verification/[requestId]`
