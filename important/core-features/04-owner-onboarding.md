# Owner Setup & Go Live

## Purpose

This doc explains how an owner moves from a fresh account to a venue that is visible, operational, and able to handle real reservation traffic.

## Current Guide Narrative

The latest owner setup guide follows this sequence:

1. Create the organization and add the venue.
2. Configure courts and availability.
3. Verify the venue and build trust.
4. Turn on notifications.
5. Invite the team.
6. Handle reservations and go live.

That is the narrative a new owner should understand first. The exact wizard and dashboard mechanics sit underneath it.

## Current Entry Points

Two owner setup surfaces still exist:

- a guided setup wizard
- a non-linear get-started hub view

Both are driven by the same setup-status domain, but they serve different behaviors: first-time guided completion versus targeted return visits.

## Setup Flow

### 1. Create Organization

The owner creates the organization container that will hold venues, courts, team membership, payment methods, and developer integrations.

### 2. Add Or Claim A Venue

Owners can either:

- create a new venue directly
- claim an existing curated venue and wait for admin review

The claim path is still operationally different because review timing affects how quickly the owner can keep moving.

### 3. Add Courts

Courts define the actual inventory that players can eventually book. Without at least one court, the venue cannot progress toward online booking readiness.

### 4. Configure Availability And Pricing

Once courts exist, the owner can publish time windows, hourly rates, and related booking rules. This is what turns a visible listing into something that can accept real booking requests.

### 5. Add A Payment Method

The current payment model is still external/manual, so owners must configure at least one organization payment method before paid reservations can work end to end.

### 6. Submit Verification

Verification is the trust step that allows the venue to move from a basic listing into a stronger public and operational state.

### 7. Turn On Notifications And Invite Team

The public guide now treats notifications and team access as part of going live, not as optional footnotes after setup. That is the correct product framing even though the current UX still surfaces parts of this later than ideal.

### 8. Handle Reservations

Once the listing, courts, availability, payment method, and verification path are in place, the owner can review reservation requests, coordinate payment, and confirm bookings from the owner portal.

## Discoverable Vs Fully Reservable

These are not the same milestone:

- A venue can be discoverable once its public listing is complete enough to help players find and assess it.
- A venue becomes fully online-reservable only when the operational prerequisites are satisfied, including ready courts, payment method support, and the relevant owner controls.

## Current UX Reality

The owner guide framing is ahead of the current UX in a few places:

- notifications are still not activated inside a dedicated wizard completion step
- team invitation is still not a first-class completion handoff
- claim-path delay remains a real blocker for some owners

Those mismatches belong in [12-gap-analysis.md](./12-gap-analysis.md), not in the primary owner narrative.

## Related Docs

- [03-venue-and-court-management.md](./03-venue-and-court-management.md) for listing quality and court readiness
- [05-team-access-permissions.md](./05-team-access-permissions.md) for delegation
- [06-notification-system.md](./06-notification-system.md) for routing and delivery
- [09-payments.md](./09-payments.md) for payment readiness
