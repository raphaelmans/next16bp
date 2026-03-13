# Notification System (Operational Reference)

_Supporting operational reference. Read after the primary owner docs in [00-overview.md](./00-overview.md)._

## Purpose

Reservation operations only work if the right owner-side recipients and players receive lifecycle signals quickly. The notification system combines inbox items with async delivery jobs for push, email, and SMS-capable channels.

## Channels

| Channel | Current Role |
|---------|--------------|
| In-app inbox | Core notification record and unread state |
| Web push | Browser/device push for subscribed users |
| Mobile push | Native push for registered mobile tokens |
| Email | Partial lifecycle coverage |
| SMS | Partial lifecycle coverage |

## Reservation Coverage

Current delivery is still uneven:

- new booking events have the broadest multi-channel coverage
- follow-up lifecycle events lean heavily on push + inbox
- expiration still lacks an owner-facing notification path

## Who Receives Owner-Side Reservation Notifications

Three conditions are applied:

1. user has `reservation.notification.receive` or is the implicit owner
2. organization preference `reservationOpsEnabled` is on
3. the selected channel is actually available for that user

## Current UX Reality

- reservation-routing configuration exists in the owner experience
- dashboard warnings surface the zero-recipient state
- notification activation is still not part of a dedicated wizard completion step
- push permission still sits separately from the routing toggle

## Related Docs

- [04-owner-onboarding.md](./04-owner-onboarding.md) for the guide-level go-live framing
- [12-gap-analysis.md](./12-gap-analysis.md) for the known onboarding and coverage gaps
