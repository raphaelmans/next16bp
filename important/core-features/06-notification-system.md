# Notification System

## Purpose

Reservation operations only work if owners and players receive lifecycle signals quickly. The notification system handles inbox items plus async delivery jobs for push/email/SMS channels.

## Notification Channels

| Channel | What the User Experiences | Status |
|---------|--------------------------|:-:|
| **In-App Inbox** | Bell icon + unread badge, latest notifications list, mark-read actions | Fully implemented |
| **Web Push** | Browser push for subscribed devices | Fully implemented |
| **Mobile Push** | Native push for registered mobile tokens | Fully implemented |
| **Email** | HTML lifecycle emails | Partial |
| **SMS** | Text fallback/summary notifications | Partial |

## Reservation Event Coverage

For reservation lifecycle events, channels are event-specific:

| Event Family | Who Gets Notified | Email/SMS | Push + Inbox |
|--------------|-------------------|:-:|:-:|
| `reservation.created` + `reservation_group.created` | Owner + opted-in members | Yes | Yes |
| `reservation.awaiting_payment` (+ group variant) | Player | No | Yes |
| `reservation.payment_marked` (+ group variant) | Owner + opted-in members | No | Yes |
| `reservation.confirmed` (+ group variant) | Player | No | Yes |
| `reservation.rejected` (+ group variant) | Player | No | Yes |
| `reservation.cancelled` (+ group variant) | Owner + opted-in members | No | Yes |
| `reservation.ping_owner` | Owner + opted-in members | No | Yes |

Notes:
- Email/SMS is currently concentrated on "new booking" reservation events.
- Expiration events still do not generate owner-facing notifications.

## Non-Reservation Notification Coverage

Admin/verification flows also use notifications:
- Verification requested/reviewed
- Claim reviewed

Those flows support push and email/SMS content generation where applicable.

## Who Receives Reservation Notifications?

Three filters are applied:

1. **Permission eligibility**: user must have `reservation.notification.receive` (owner is implicitly eligible).
2. **Organization opt-in preference**: `reservationOpsEnabled` must be true for that user/org.
3. **Channel availability**: push subscription/token, email address, phone number, and channel flags determine which jobs are enqueued.

## Notification Preferences UI

Current owner-side behavior:
- Routing toggle for reservation lifecycle notifications.
- Enabled-recipient count.
- Warning if no recipients are enabled.
- Permission-aware messaging when user cannot manage routing.

## Delivery Reliability

- Notification jobs are persisted first, then dispatched asynchronously.
- Dispatch is retried with backoff up to retry limits.
- Idempotency keys prevent duplicate delivery jobs.

## Current UX Reality

- There is still no dedicated "enable notifications" step inside wizard completion.
- Dashboard now surfaces a reservation routing warning when no recipients are enabled.
- Team members still need to separately enable routing and push permissions themselves.
