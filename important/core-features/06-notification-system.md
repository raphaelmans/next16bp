# Notification System

## Purpose

When a player books a court, the venue must respond promptly — accept the booking, confirm payment, or reject. The notification system ensures the right people at the venue are alerted when booking events occur.

## Notification Channels

| Channel | What the User Experiences | Status |
|---------|--------------------------|:-:|
| **In-App Inbox** | Bell icon in the navbar with unread count badge. Dropdown shows up to 20 notifications with mark-read actions. | Fully implemented |
| **Web Push** | Browser popup notifications, even when the app tab is in the background. Multi-device support. | Fully implemented |
| **Mobile Push** | Native push notifications on the mobile app. Multi-device support. | Fully implemented |
| **Email** | HTML email with full booking details and a "Review & Respond" button. | Partial — only new bookings |
| **SMS** | Text message with compact summary and link. | Infrastructure built, not fully connected |

## What Events Trigger Notifications?

| Event | What Happened | Who Gets Notified | Email | Push/Inbox |
|-------|--------------|-------------------|:-:|:-:|
| New booking | Player reserved a court | Owner + opted-in members | Yes | Yes |
| Group booking | Player reserved multiple courts | Owner + opted-in members | Yes | Yes |
| Awaiting payment | Booking accepted, waiting for player to pay | Player only | No | Yes |
| Payment marked | Player uploaded payment proof | Owner + opted-in members | No | Yes |
| Booking confirmed | Owner confirmed the reservation | Player only | No | Yes |
| Booking rejected | Owner declined the reservation | Player only | No | Yes |
| Booking cancelled | Player cancelled | Owner + opted-in members | No | Yes |
| Player pinged | Player sent a nudge to the owner | Owner + opted-in members | No | Yes |

Only 2 of 8 events send email. The rest rely on push and inbox only.

## Who Receives Notifications?

Three-layer filter:

1. **Permission** — Only members with the "Receive reservation notifications" permission are eligible. Viewers do not have this by default.
2. **Opt-in** — Eligible members must toggle their notification preference ON. This is a single toggle per member per organization — all-or-nothing across all channels.
3. **Delivery** — Notifications go to all enabled channels simultaneously. There is no per-channel preference.

## Notification Preferences UI

Located in notification routing settings:

- Master toggle: "Receive venue reservation lifecycle notifications"
- Count of currently opted-in members (e.g., "2 of 3 opted in")
- Warning if zero members are opted in
- Permission hint if the user lacks the required permission

## Delivery Reliability

- Notification jobs are created within the same database transaction as the booking event — no notification is lost even if the system crashes afterward.
- A background process picks up and dispatches pending jobs in batches.
- Failed deliveries retry with increasing delays up to 5 attempts.
- Each notification has a uniqueness key to prevent duplicates.

## What the User Experiences Today

**As an Owner (after setup):** No notification prompt during or after onboarding. Must manually find notification settings, toggle ON, then separately grant browser push permission.

**As an Invited Team Member:** No welcome screen or notification prompt after accepting. Must independently discover settings and enable notifications.

**If nobody opts in:** New bookings appear in the reservation list but nobody is alerted. The settings page shows a warning, but no proactive nudge appears elsewhere. Bookings may expire unnoticed.
