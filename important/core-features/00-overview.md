# KudosCourts Core Features

This folder now follows the current public guides narrative first:

- Players start by finding the right venue by city and sport, then continue into booking and reservation tracking.
- Owners first care about getting found with an accurate listing, then about setting up operations that let them go live safely.
- Developers have a separate canonical doc set for system-to-system integration.

## Current Narrative Source Of Truth

Use these as the latest narrative inputs when refreshing this folder:

- `src/features/guides/content/guides.ts`
- `src/features/guides/pages/guides-index-page.tsx`

Runtime behavior still comes from code. If the guides copy and implementation diverge, document the implementation here and record the mismatch in [12-gap-analysis.md](./12-gap-analysis.md).

## Primary Guide-Aligned Reading Path

| Audience | Primary Question | Document |
|----------|------------------|----------|
| Player | How do I find a venue worth opening? | [01-discovery-and-booking.md](./01-discovery-and-booking.md) |
| Player | How do I move from slot selection to a tracked reservation? | [02-reservation-lifecycle.md](./02-reservation-lifecycle.md) |
| Owner | How does a venue get found and trusted online? | [03-venue-and-court-management.md](./03-venue-and-court-management.md) |
| Owner | How does an owner go from zero setup to live operations? | [04-owner-onboarding.md](./04-owner-onboarding.md) |

## Developer Guide Surface

Developer integration remains canonical in the adjacent doc set instead of being duplicated here:

- [../developer-integration/00-overview.md](../developer-integration/00-overview.md)

## Supporting Operational References

These docs stay in this folder, but they are secondary references behind the primary player/owner narrative above.

| Area | Document |
|------|----------|
| Team roles, permissions, invites | [05-team-access-permissions.md](./05-team-access-permissions.md) |
| Notification routing and delivery | [06-notification-system.md](./06-notification-system.md) |
| Social booking and external sessions | [07-open-play.md](./07-open-play.md) |
| Reservation and open-play chat | [08-chat-and-messaging.md](./08-chat-and-messaging.md) |
| Offline/manual payment flow | [09-payments.md](./09-payments.md) |
| Admin review and moderation tools | [10-admin-operations.md](./10-admin-operations.md) |
| Auth, profiles, reservations, saved venues | [11-accounts-and-profiles.md](./11-accounts-and-profiles.md) |

## Appendices

| Type | Document |
|------|----------|
| Product and UX gaps | [12-gap-analysis.md](./12-gap-analysis.md) |
| End-to-end flow maps | [13-user-flow-maps.md](./13-user-flow-maps.md) |

## Source Maps

- [99-source-files.md](./99-source-files.md) for the feature-to-code map used by this folder
- [../developer-integration/99-source-files.md](../developer-integration/99-source-files.md) for the developer integration source map

## Current Product Loop

```text
Player discovery -> Venue trust -> Reservation request -> Owner review
                -> Payment and coordination when needed -> Confirmed play
                -> Better visibility and repeat usage
```

The guide-aligned docs emphasize this loop from the outside in. The supporting references explain the operational systems behind it.
