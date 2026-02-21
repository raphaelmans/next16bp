# Admin Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Admin domain provides platform-level management capabilities for KudosCourts staff. This includes curating the place inventory, moderating claim requests from venue owners, verifying place documents, and triggering system-level notifications.

## Data Model

The Admin domain interacts with data across the system but primarily governs the lifecycle transitions of:

- **Place**: `claimStatus` transitions (`UNCLAIMED` -> `CLAIMED`).
- **ClaimRequest**: Approval/Rejection of ownership claims.
- **PlaceVerification**: Verification of business documents.
- **NotificationDelivery**: Testing and manual dispatch of system notifications.

## API & Actions

Based on `src/features/admin/api.ts` (mapping to tRPC routers):

### Claim Management
- **`claim.approve` / `claim.reject`**: Process ownership claims.
- **`claim.getPending` / `claim.getById`**: Review queue for claims.

### Court/Place Curation
- **`court.createCurated` / `court.createCuratedBatch`**: Add new venues to the platform (bootstrap inventory).
- **`court.recurate`**: Return a claimed place to the curated (unclaimed) pool.
- **`court.transfer`**: Move a place to a different organization.
- **`court.activate` / `court.deactivate`**: Global kill-switch for venues.
- **`court.deletePlace`**: Hard delete (use with caution).
- **`court.uploadPhoto` / `court.removePhoto`**: Manage listing media.

### Verification
- **`placeVerification.approve` / `placeVerification.reject`**: Business verification workflow.
- **`placeVerification.getPending`**: Review queue for verifications.

### System Tools
- **`notificationDelivery.dispatchNow`**: Force run of notification workers.
- **`notificationDelivery.enqueue*Test`**: Trigger test emails/push notifications for development/QA.

## Key Logic

- **Curation Workflow**: Admins can "bootstrap" the platform by creating "Curated Places" (view-only). These can later be "claimed" by real owners.
- **Moderation**: All ownership transfers (Claims) and "Verified" badges require explicit admin action; there is no auto-approval for these high-trust states.
- **Override Capabilities**: Admins have superuser-like permissions to edit availability, transfer ownership, or modify listing details on behalf of owners.
