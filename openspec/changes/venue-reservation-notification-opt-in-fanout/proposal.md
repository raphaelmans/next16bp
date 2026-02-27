## Why

Owner-side reservation lifecycle notifications are currently routed to a single owner recipient and are effectively always-on once channel contact/subscriptions exist. With organization member RBAC now available, venues need multi-member notification routing so operations teams can share booking workload without spamming every member by default.

## What Changes

- Add organization-scoped, per-user reservation notification preference (`reservationOpsEnabled`) with default `false`.
- Add new organization permission `reservation.notification.receive` to control who is eligible to opt in.
- Fan out owner-side reservation lifecycle notifications to all eligible users who explicitly opted in.
- Apply opt-in gating across all owner-side channels for these events: inbox, web push, mobile push, email, SMS.
- Add owner settings self-service toggle for reservation notification routing.
- Add owner dashboard warning banner when no recipients are currently enabled.

## Capabilities

### New Capabilities
- `reservation-notification-routing`: Organization members can explicitly opt in to receive owner-side reservation lifecycle notifications, and routing fans out to all enabled recipients.

### Modified Capabilities
- `chat-notification`: Clarify owner-side reservation notification routing behavior with explicit opt-in and multi-member fan-out.
- `reservation-group-notification-delivery`: Preserve grouped routing semantics while applying recipient fan-out and opt-in gating for owner-side delivery.

## Impact

- DB: New `organization_member_notification_preference` table and indexes.
- Backend: Extend organization-member repository/service/router with notification preference + routing-status operations; update notification-delivery recipient resolution and fan-out logic.
- Frontend: Add owner hooks/API methods and settings card for self-service preference; add dashboard banner linked to settings section.
- Testing: Add/update unit tests for organization-member preference logic, router procedures, and notification-delivery fan-out behavior.
