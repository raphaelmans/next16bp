# Team Access & Permissions

## Purpose

Venue owners delegate operational work to staff. Team access controls who can view reservations, take booking actions, manage team members, and manage venue/court configuration.

## Role Hierarchy

| Role | Who Is This? | Default Capabilities |
|------|-------------|----------------------|
| **Owner** | Organization owner. Cannot be removed/demoted. | Full access across owner portal. |
| **Manager** | Trusted staff member invited by owner. | Reservation operations, guest bookings/imports, chat, notification routing opt-in, team management, venue/court management (`place.manage`), and settings access. |
| **Viewer** | Limited staff role. | Reservation read access only by default. |

The owner is treated as implicitly having all permissions.

## Granular Permissions

7 permission flags exist in the permission model:

| Permission | What It Unlocks | Owner | Manager (Default) | Viewer (Default) |
|------------|----------------|:-:|:-:|:-:|
| `reservation.read` | View reservation list/details | Yes | Yes | Yes |
| `reservation.update_status` | Accept/confirm/reject reservation lifecycle actions | Yes | Yes | No |
| `reservation.guest_booking` | Create guest bookings and access imports | Yes | Yes | No |
| `reservation.chat` | Access reservation chat threads | Yes | Yes | No |
| `reservation.notification.receive` | Eligible for reservation lifecycle notification routing | Yes | Yes | No |
| `organization.member.manage` | Invite/edit/revoke members and invitations | Yes | Yes | No |
| `place.manage` | Edit venues/courts, setup/config pages | Yes | Yes | No |

## What Each Role Sees

### Desktop Sidebar

| Nav Item | Owner | Manager | Viewer |
|----------|:-:|:-:|:-:|
| Dashboard | Yes | Yes | Yes |
| Get Started (if setup incomplete) | Yes | No | No |
| Courts (public discovery link) | Yes | Yes | Yes |
| Venues | Yes | Yes | Yes |
| Availability Studio | Yes | Yes | Yes |
| Reservations | Yes | Yes (with `reservation.read`) | Yes (with `reservation.read`) |
| Imports | Yes | Yes (with `reservation.guest_booking`) | No |
| Team | Yes | Yes | Yes |
| Profile | Yes | Yes | Yes |
| Settings | Yes | Yes | No |

### Mobile Bottom Navigation

**Owner / Manager**
- Reservations
- Studio
- Venues
- More (Dashboard, Team, Settings, Imports)
- Owner-only nuance: during incomplete setup, "Get Started" can temporarily replace "Reservations" in the tab bar.

**Viewer**
- Reservations
- Studio
- Venues
- No "More" sheet.

## Page-Level Protection

Most action pages enforce RBAC in UI and service layer:

- **Owner-only:** create venue, verification entry/review pages.
- **`place.manage` gated:** venue edit, court create/edit/setup/availability pages.
- **`reservation.guest_booking` gated:** booking imports pages.
- **Owner-or-manager:** settings page.

Current implementation gaps still present:
- Reservations page shell itself is not wrapped in a page-level `PermissionGate`.
- Team page shell is accessible, but management actions are gated inside the page.

## Team Invitation Journey

### Inviting a Member

1. Owner (or authorized manager) opens Team.
2. Clicks "Invite member."
3. Enters email, selects role, and optionally customizes permissions.
4. Invitation email is sent (7-day expiry).

### Accepting an Invitation

1. Invitee opens link from email.
2. If not registered, signs up first with the same email.
3. Reviews org/role/permissions and accepts or declines.
4. On accept, access is granted immediately.

### Invitation States

`PENDING → ACCEPTED / DECLINED / EXPIRED / CANCELED`

### Security

- Email match is enforced.
- Invitation token is single-use.
- Invitation token is stored hashed.

## Team Management

Members with `organization.member.manage` can:
- Change role (Manager/Viewer)
- Edit permission set
- Revoke active members
- Cancel pending invitations

The owner cannot be edited, demoted, or revoked.
