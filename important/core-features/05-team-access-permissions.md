# Team Access & Permissions

## Purpose

Venue owners rarely manage bookings alone. They delegate to front-desk staff, managers, or co-owners. The team access system controls who can see what and do what within the owner portal.

## Role Hierarchy

| Role | Who Is This? | What Can They Do? |
|------|-------------|-------------------|
| **Owner** | The person who created the organization. One per org. Cannot be removed or demoted. | Everything — full control over venues, courts, settings, team, and bookings. |
| **Manager** | A trusted staff member invited by the owner. | Manage reservations, create guest bookings, import bookings, access chat, manage other team members, receive notifications. Cannot change organization settings or edit venues/courts. |
| **Viewer** | A limited staff member with read-only access. | View reservations only. Cannot take actions on bookings, manage team, or access imports. |

## Granular Permissions

6 individual permissions that can be toggled per member:

| Permission | What It Unlocks | Owner | Manager | Viewer |
|------------|----------------|:-:|:-:|:-:|
| View reservations | See the reservation list and details | Yes | Yes | Yes |
| Update reservation status | Confirm or reject a booking | Yes | Yes | No |
| Create guest bookings | Book on behalf of walk-in customers; access imports | Yes | Yes | No |
| Access reservation chat | Read and send messages in reservation threads | Yes | Yes | No |
| Receive reservation notifications | Opt in to booking alerts | Yes | Yes | No |
| Manage team members | Invite, edit, and revoke team members | Yes | Yes | No |

The owner always passes all checks regardless of individual toggles.

## What Each Role Sees

### Desktop Sidebar

| Nav Item | Owner | Manager | Viewer |
|----------|:-:|:-:|:-:|
| Dashboard | Yes | Yes | Yes |
| Get Started (during setup) | Yes | No | No |
| Courts (discovery) | Yes | Yes | Yes |
| Venues (with court sub-items) | Yes | Yes | Yes |
| Availability Studio | Yes | Yes | Yes |
| Reservations | Yes | Yes | Yes |
| Imports | Yes | Yes | No |
| Team | Yes | Yes | Yes |
| Settings | Yes | No | No |

### Mobile Bottom Navigation

**Owner:** Reservations · Courts · Venues · More (Dashboard, Availability Studio, Imports, Team, Settings, Get Started)

**Manager:** Reservations · Courts · Imports · More (Dashboard, Availability Studio, Venues, Team)

**Viewer:** Reservations · Courts · Profile _(no "More" menu)_

## Page-Level Protection

Most pages are protected by a permission gate. If a user navigates to a page they cannot access, they see a "You do not have permission to view this page" message.

**Owner-only pages:** Settings, Create/Edit venues, Create/Edit/Configure courts, Court availability, Venue verification

**Permission-gated pages:** Booking imports (requires "Create guest bookings")

**Currently ungated pages:** Reservations page (any member can access by URL), Team page (loads for everyone, but the management UI inside blocks non-authorized users)

## Team Invitation Journey

### Inviting a Member

1. Owner (or manager with permission) navigates to the Team page.
2. Clicks "Invite Member."
3. Enters the invitee's email, selects a role (Manager or Viewer), and optionally toggles individual permissions.
4. Submits. The system sends an invitation email.

The invitation email includes the organization name, assigned role, listed permissions, and a call-to-action button. It expires after 7 days.

### Accepting an Invitation

1. Invitee receives the email.
2. Clicks the invitation link.
3. If not registered: creates an account with the same email first.
4. If already registered: logs in.
5. Sees the invitation details (org name, role, permissions) and chooses Accept or Decline.
6. On accept: immediately gains access to the owner dashboard with the assigned role.

### Invitation States

PENDING → ACCEPTED / DECLINED / EXPIRED (7 days) / CANCELED (by inviter)

### Security

- Email must match exactly — the invitee cannot use a different email address.
- Tokens are securely hashed before storage.
- Each invitation can only be used once.

## Team Management

Active members can be managed by anyone with the "Manage team members" permission:

- **Change role** — Promote or demote between Manager and Viewer
- **Toggle permissions** — Fine-tune individual permissions
- **Revoke access** — Remove from the organization
- **Cancel invitations** — Withdraw pending invitations

The owner cannot be edited, demoted, or removed by anyone.
