# Team Access & Permissions (Operational Reference)

_Supporting operational reference. Read after the primary owner docs in [00-overview.md](./00-overview.md)._

## Purpose

Venue owners delegate reservation work, venue operations, and organization management through a mix of role defaults and granular permission flags.

## Role Model

| Role | Description | Default Shape |
|------|-------------|---------------|
| Owner | Organization owner | Full access and implicit permission coverage |
| Manager | Trusted staff member | Operational access across reservations, places, team, chat, and notifications |
| Viewer | Limited staff member | Read-first access with fewer operational actions |

## Granular Permissions

The current permission model centers these flags:

| Permission | What It Unlocks |
|------------|-----------------|
| `reservation.read` | View reservation list and details |
| `reservation.update_status` | Accept, confirm, reject, and cancel reservation flows |
| `reservation.guest_booking` | Create guest bookings and use import-related flows |
| `reservation.chat` | Join reservation chat threads |
| `reservation.notification.receive` | Be eligible for routed reservation notifications |
| `organization.member.manage` | Invite, edit, revoke, and cancel member/invitation access |
| `place.manage` | Edit venues, courts, availability, and related setup surfaces |

## Navigation Reality

### Desktop

The owner portal is role- and permission-aware. Dashboard, reservations, studio, team, settings, places, and imports are shown or hidden based on the current member role and permission set.

### Mobile

All three organization roles currently get the same top-level tabs:

- Dashboard
- Reservations
- Studio
- More

The difference is inside the More sheet, where role and permission checks decide whether the user sees Venues, Team, Settings, Imports, and related organization pages.

## Page-Level Protection

Most sensitive owner actions are gated in both UI and service/router layers:

- `place.manage` for place, court, and availability configuration
- `reservation.guest_booking` for guest-booking and import workflows
- `organization.member.manage` for team administration

Current implementation gaps still matter:

- the reservations page shell is still not wrapped in a full page-level permission gate
- the team page shell still renders before management actions are blocked

## Team Invitation Flow

### Invite

1. Authorized member opens Team.
2. Sends an invitation by email with role and permission selections.
3. Invitation enters `PENDING` status.

### Accept / Decline

1. Invitee signs in with the matching email.
2. Invitee enters the invitation code from the email.
3. Invitee accepts or declines.

Invitation states:

`PENDING -> ACCEPTED / DECLINED / EXPIRED / CANCELED`

## Management Actions

Authorized members can:

- change role
- edit granular permissions
- revoke members
- cancel pending invitations

The owner remains non-editable and cannot be demoted or revoked.
