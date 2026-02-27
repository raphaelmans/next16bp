## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal for `venue-reservation-notification-opt-in-fanout`
- [x] 1.2 Create design covering opt-in preference model and delivery fan-out
- [x] 1.3 Create spec deltas for reservation notification routing capabilities

## 2. Database + Schema

- [x] 2.1 Add `organization_member_notification_preference` Drizzle schema
- [x] 2.2 Add indexes and exports for notification preference schema
- [x] 2.3 Add migration for notification preference table

## 3. Organization Member Backend

- [x] 3.1 Add `reservation.notification.receive` permission constant and default
      role bundles
- [x] 3.2 Extend organization-member repository/service with preference
      read/write and recipient-listing methods
- [x] 3.3 Add organization-member router procedures for personal preference and
      routing status

## 4. Notification Delivery Fan-out

- [x] 4.1 Add recipient-repository support for listing organization recipients by
      user id set
- [x] 4.2 Fan out owner-side reservation lifecycle delivery to opted-in eligible
      members
- [x] 4.3 Fan out grouped reservation owner-side delivery with same opt-in
      recipient model
- [x] 4.4 Add no-recipient short-circuit logging for muted organizations

## 5. Owner UI

- [x] 5.1 Extend owner API and hooks for notification preference and routing
      status operations
- [x] 5.2 Add owner settings "Reservation Notification Routing" toggle card
- [x] 5.3 Add owner dashboard warning when enabled recipient count is zero
- [x] 5.4 Add Team & Access permission label for
      `reservation.notification.receive`

## 6. Tests + Validation

- [x] 6.1 Add/update organization-member service and router unit tests for
      preference and routing status behavior
- [x] 6.2 Add/update notification-delivery unit tests for fan-out and no-recipient
      behavior
- [x] 6.3 Run targeted lint checks and impacted unit tests for changed modules
