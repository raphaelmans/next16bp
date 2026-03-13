# Accounts & Profiles (Operational Reference)

_Supporting operational reference. Read after the primary player and owner docs in [00-overview.md](./00-overview.md)._

## Purpose

Accounts tie together authentication, profile completeness, reservation ownership, saved venues, and the user's preferred portal context.

## Authentication

Current auth paths include:

- email and password
- magic link
- Google OAuth

## Post-Login Routing And Portal Preference

Portal context is still a first-class concept, but it is more explicit than the older dropdown-toggle story.

Current shape:

- post-login routing respects the saved default portal when possible
- the app includes a dedicated portal switcher component
- the profile/account area includes a default-portal preference card
- the user dropdown mainly exposes shortcuts such as Saved Venues, My Reservations, Profile, and owner/admin entry points

## Player Profile

The profile remains important because booking requires a complete player identity. The flow depends on required profile fields such as name, email, and phone before reservation confirmation can complete.

## Player Home

Current quick actions are:

- Find Courts
- My Reservations
- Profile

Additional cards appear only when relevant:

- owners get Venue Dashboard
- admins get Admin Dashboard

## My Reservations

The player reservation area still groups bookings into:

- Pending
- Upcoming
- Past
- Cancelled

Reservation detail remains the main place to review booking status, payment steps, reservation chat, and related follow-up actions.

## Saved Venues

Players can bookmark venues from public discovery surfaces and return to them from the dedicated Saved Venues page.

## Invitations

Organization invitations are now code-entry driven:

1. invitee signs in with the matching email
2. invitee enters the invitation code from the email
3. invitee accepts or declines

The current acceptance page is a lightweight access-confirmation flow, not a rich pre-acceptance preview of organization, role, and permissions.

## PWA And Browser Context

The app still includes install-prompt handling and browser-based notification/push support for supported environments.

## What Account Features Still Do Not Cover

- no self-serve account deletion
- no reservation-history export
- no dedicated notification-history page beyond the inbox/bell surfaces
- recovery and reset flows remain provider-driven rather than deeply productized
