# Accounts & Profiles

## Purpose

Every user on the platform has an account. The account system handles authentication, profile management, portal preferences, and cross-portal identity (a single user can be both a player and a venue owner).

## Authentication

### Sign Up / Sign In

- **Email + password** — Standard registration and login
- **Magic link** — Passwordless login via a link sent to the user's email
- **Social login** — Supported via identity providers

### Post-Login Routing

After logging in, the system checks the user's portal preference (player or owner) and redirects accordingly:

- **Player preference:** Redirected to `/home` (player dashboard)
- **Owner preference:** Redirected to `/owner` (owner dashboard)
- **First-time user:** Defaults to the player portal

### Owner Registration

A separate registration path exists for users who intend to list a venue. This sets their portal preference to "owner" and routes them into the onboarding wizard after signup.

## Player Profile

Accessible from the account menu or `/account/profile`.

**What the player manages:**
- Full name
- Email address
- Phone number
- Avatar photo (upload/change)

**Profile completeness matters:** Players cannot complete a booking without a name, email, and phone number. If the profile is incomplete, the booking flow prompts them to fill in the missing fields.

## Player Home Page

The player's landing page after login.

**What the player sees:**
- Welcome greeting with their name
- Profile completion banner (if incomplete)
- Quick action cards: Find Courts, My Reservations, Profile, Venue Setup (for becoming an owner)
- Upcoming reservations widget showing the next 3–5 bookings with court, venue, date/time, and status
- "View All" link to the full reservations list

## Portal Preference

Users who are both players and venue owners can switch between portals:

- A toggle in the user dropdown menu switches between "Player" and "Owner" mode
- The preference is saved so the correct portal loads on next login
- The platform remembers the last-used portal per device

**Business purpose:** Many venue owners also play sports. The dual-portal design lets them manage their venue and book courts at other venues without separate accounts.

## My Reservations (Player)

The player's reservation management page.

**Tabs:**
- **Upcoming** — Confirmed future bookings
- **Past** — Completed bookings

**Each reservation shows:**
- Reservation ID
- Court and venue name
- Date and time
- Status badge (color-coded)
- Amount
- Available actions (pay, cancel, view details)

**Reservation detail page includes:**
- Full booking information (court, venue, date, time, duration, sport, price breakdown)
- Current status with explanation
- Payment information (if applicable): method used, proof uploaded, payment status
- Owner contact information for paid bookings
- Chat widget to message the venue
- Actions: Cancel reservation, Ping owner (send nudge), Create Open Play from this reservation

## Invitations

When a venue owner invites someone to their team, the invitee receives an email with a link. The acceptance flow:

1. Click the link → land on the invitation acceptance page
2. If not logged in: prompted to register or sign in (email must match the invitation)
3. See invitation details: organization name, assigned role, listed permissions
4. Accept or Decline
5. On accept: immediately gain access to the owner portal with the assigned role

## Notification Preferences (Player Side)

On the profile page, players can:

- Toggle browser notification settings (enable/disable)
- See the current browser permission state (granted, denied, not asked)
- Default portal preference card showing the saved preference

## Progressive Web App (PWA)

The platform supports installation as a PWA:

- **Install prompt** appears after a few seconds on supported browsers
- iOS users see instructions for "Share → Add to Home Screen"
- Once installed, the app launches as a standalone experience without the browser bar
- Supports push notifications and offline access via service worker

**Business purpose:** In markets where app store discovery is less reliable, PWA installation gives the platform a native-app feel without requiring an app store listing.

## What Account Features Do NOT Cover (Currently)

- **No password reset flow documented in the UI** — relies on the auth provider's built-in flow
- **No account deletion** — users cannot delete their own account from the UI
- **No booking history export** — players cannot download their reservation history
- **No notification history page** — notifications are only accessible via the bell dropdown (up to 20 items)
- **No saved venues or favorites** — players cannot bookmark venues for quick access later
