## Context

Owner-side reservation lifecycle notifications were historically resolved to a
single owner recipient. After organization member RBAC was introduced,
reservation operations can be delegated, but notification routing still behaved
as single-recipient and effectively always-on for that recipient.

This change introduces organization-scoped opt-in routing so reservation
operations notifications can fan out to multiple venue team members who are both
authorized and explicitly subscribed.

## Goals / Non-Goals

**Goals:**
- Add an explicit per-organization opt-in for reservation operations
  notifications, defaulted to off.
- Ensure eligibility is permission-gated by a dedicated RBAC permission.
- Fan out owner-side reservation lifecycle notifications to all opted-in and
  eligible organization members.
- Expose owner-facing UI controls and routing health signals (enabled-recipient
  count).
- Keep grouped reservation notifications consistent with the same opt-in
  recipient routing model.

**Non-Goals:**
- Introducing per-event granularity (for example separate toggles per lifecycle
  event type).
- Enabling notifications by default for owners or members.
- Reworking player-side notification delivery behavior.
- Redesigning broader organization member management UX beyond this toggle and
  routing status.

## Decisions

### D1: Use a dedicated notification preference table

Create `organization_member_notification_preference` keyed by
`(organization_id, user_id)` with `reservation_ops_enabled` defaulting to
`false`.

Rationale:
- Keeps notification routing concerns separate from core membership lifecycle.
- Avoids implicit enablement when members are invited or role-permissions
  change.
- Supports future extension with additional opt-in toggles.

Alternatives considered:
- Store preference inside `organization_member.permissions`: rejected because
  authorization permission and notification preference are different concerns.
- Store preference in notification recipient profile only: rejected because
  routing is organization-scoped, not global-user scoped.

### D2: Gate opt-in eligibility with a dedicated permission

Add `reservation.notification.receive` to organization member permissions.
Only users with this permission can enable the reservation notification toggle.

Rationale:
- Enables explicit delegation control by owner/manager admins.
- Prevents broad notification access for members who can view reservations but
  should not receive operational alerts.

Alternatives considered:
- Reuse `reservation.read`: rejected because read access does not imply delivery
  subscription rights.

### D3: Centralize recipient resolution in organization-member service

Add organization-member service/repository methods to:
- read and upsert current-user preference,
- compute routing status count,
- list eligible opted-in user ids.

Rationale:
- Maintains single-source authorization and membership resolution logic.
- Avoids duplicating intersection logic in notification delivery service and UI
  layers.

Alternatives considered:
- Compute recipients directly in notification delivery repository: rejected to
  avoid leaking RBAC policy into delivery infrastructure.

### D4: Fan out owner lifecycle notifications in notification-delivery service

Update owner-side reservation and reservation-group enqueue flows to:
- resolve opted-in organization recipients,
- enqueue one delivery job per recipient across supported channels for that
  event,
- short-circuit with structured log when no opted-in recipient exists.

Rationale:
- Preserves existing event contracts and channel behavior while changing only
  recipient selection.
- Keeps fan-out close to event-to-channel orchestration logic.

Alternatives considered:
- Precompute synthetic "organization recipient" channels: rejected because
  existing recipient/channel abstractions are user-centric and sufficient.

### D5: Provide owner visibility and self-service controls

Expose tRPC operations for personal preference and org routing status.
Add owner settings toggle card and dashboard warning when enabled-recipient
count is zero.

Rationale:
- Reduces silent failure risk when no one is opted in.
- Allows each eligible member to control personal subscription without requiring
  admin intervention for every change.

## Risks / Trade-offs

- [No enabled recipients can mute operational alerts] -> Mitigation: dashboard
  warning + structured log `notification_delivery.no_opted_in_owner_recipients`.
- [Permission confusion between "can manage reservations" and "can receive
  notifications"] -> Mitigation: dedicated permission label in Team & Access UI.
- [Fan-out increases job volume for large teams] -> Mitigation: recipient list is
  bounded by opted-in members; no-op path when zero recipients.
- [Preference record drift after permission removal] -> Mitigation: routing
  computes intersection of permission + opt-in; stale opt-in rows do not produce
  recipients.

## Migration Plan

1. Apply DB migration adding
   `organization_member_notification_preference` and indexes.
2. Deploy backend changes adding permission constant, preference APIs, routing
   status, and fan-out delivery behavior.
3. Deploy owner UI changes for toggle and dashboard warning.
4. Validate with unit tests around service/router/delivery fan-out and targeted
   lint checks.

Rollback strategy:
- Revert service wiring to single-recipient routing.
- Keep table in place (safe additive schema) or remove via follow-up migration
  if required.

## Open Questions

- Should canonical owners receive an implicit fallback notification when
  enabled-recipient count is zero, or remain fully opt-in only?
- Should future phases add per-channel toggles (email/push/SMS) per
  organization membership instead of one `reservationOpsEnabled` switch?
