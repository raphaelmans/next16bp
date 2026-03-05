# KudosCourts Platform Overview

## What Is KudosCourts?

KudosCourts is a court booking platform that connects sports venue owners with players looking to reserve courts. It replaces the manual process of messaging venue owners on social media, checking availability over the phone, and sending payment screenshots — with a unified search, book, and pay experience.

## Who Uses It?

| User Type | Description |
|-----------|-------------|
| **Player** | Someone looking to find and book a sports court — badminton, basketball, tennis, pickleball, etc. |
| **Venue Owner** | A business operator who lists their venue and courts on the platform to receive online bookings. |
| **Team Member** | A staff person (manager or viewer) invited by the venue owner to help manage bookings. |
| **Admin** | A platform operator who reviews venue claims, approves verifications, and maintains data quality. |

## The Core Value Loop

```
Venue owners list courts → Players discover and book → Owners confirm and get paid → Players play → Both return
```

For this loop to work, three things must happen:

1. **The venue must be fully set up** — organization, venue, courts, schedule, pricing, payment method, and verification.
2. **Someone at the venue must be listening** — notifications enabled, team members onboarded.
3. **Players must find and trust the listing** — discovery, verified badges, transparent pricing.

## Platform Surface Areas

The platform has four distinct portals, each serving a different user:

| Portal | Entry Point | Purpose |
|--------|-------------|---------|
| **Discovery (Public)** | `/`, `/courts`, `/venues` | Browse venues, view courts, check availability, see pricing |
| **Player (Protected)** | `/home`, `/reservations` | Book courts, manage reservations, pay, chat with owners, join open play sessions |
| **Owner (Protected)** | `/owner` | Manage venues, courts, reservations, team, settings, payments |
| **Admin (Protected)** | `/admin` | Review claims, approve verifications, manage platform data |

## Feature Map

| # | Feature Area | Document |
|---|-------------|----------|
| 1 | Discovery & Booking (Player) | [01-discovery-and-booking.md](./01-discovery-and-booking.md) |
| 2 | Reservation Lifecycle | [02-reservation-lifecycle.md](./02-reservation-lifecycle.md) |
| 3 | Venue & Court Management (Owner) | [03-venue-and-court-management.md](./03-venue-and-court-management.md) |
| 4 | Owner Onboarding | [04-owner-onboarding.md](./04-owner-onboarding.md) |
| 5 | Team Access & Permissions | [05-team-access-permissions.md](./05-team-access-permissions.md) |
| 6 | Notifications | [06-notification-system.md](./06-notification-system.md) |
| 7 | Open Play (Social Booking) | [07-open-play.md](./07-open-play.md) |
| 8 | Chat & Messaging | [08-chat-and-messaging.md](./08-chat-and-messaging.md) |
| 9 | Payments | [09-payments.md](./09-payments.md) |
| 10 | Admin Operations | [10-admin-operations.md](./10-admin-operations.md) |
| 11 | Accounts & Profiles | [11-accounts-and-profiles.md](./11-accounts-and-profiles.md) |
| 12 | Gap Analysis | [12-gap-analysis.md](./12-gap-analysis.md) |
| 13 | User Flow Maps | [13-user-flow-maps.md](./13-user-flow-maps.md) |
| 14 | Source Files | [99-source-files.md](./99-source-files.md) _(engineering reference)_ |

## How Features Connect

```
Discovery ──→ Booking ──→ Reservation Created
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Notification    Chat Thread      Payment Flow
        (to Owner)     (Player↔Owner)   (Player pays)
              │               │               │
              ▼               ▼               ▼
        Owner Confirms ←── Coordination ←── Proof Uploaded
              │
              ▼
        Reservation Confirmed → Player Plays → Loop Continues
```

## Documentation Basis

Based on full repository analysis of the KudosCourts codebase (updated March 2026). Written for the product team to support feature discussions, pitch deck preparation, and design work.
