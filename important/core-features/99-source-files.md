# Source Files

_Engineering reference mapping feature docs to implementation files (code is source of truth)._

## Discovery & Booking

- Discovery pages/cards/hooks: `src/features/discovery/pages/`, `src/features/discovery/components/`, `src/features/discovery/hooks.ts`
- Availability service (server): `src/lib/modules/availability/services/availability.service.ts`
- Schedule pricing engine: `src/lib/shared/lib/schedule-availability.ts`
- Cross-week booking range merge helper: `src/features/discovery/place-detail/helpers/cross-week-range.ts`
- Booking cart day-window rules (cross-midnight aware): `src/features/discovery/place-detail/helpers/booking-cart-rules.ts`
- Cross-week tests: `src/__tests__/features/discovery/place-detail/helpers/cross-week-range.test.ts`, `src/__tests__/features/discovery/place-detail/helpers/booking-cart-rules.test.ts`

## Reservation Lifecycle

- Reservation status enum: `src/lib/shared/infra/db/schema/enums.ts`
- Reservation schema: `src/lib/shared/infra/db/schema/reservation.ts`
- Player reservation service: `src/lib/modules/reservation/services/reservation.service.ts`
- Owner reservation actions: `src/lib/modules/reservation/services/reservation-owner.service.ts`
- Reservation status aggregation helpers: `src/lib/modules/reservation/shared/domain.ts`
- Owner reservation UI (tabs/state buckets): `src/features/owner/pages/owner-reservations-page.tsx`
- Player reservation tabs/list classification: `src/features/reservation/components/reservation-tabs.tsx`, `src/features/reservation/hooks.ts`

## Venue & Court Management

- Place management service/router: `src/lib/modules/place/services/place-management.service.ts`, `src/lib/modules/place/place-management.router.ts`
- Court management service/router: `src/lib/modules/court/services/court-management.service.ts`, `src/lib/modules/court/court-management.router.ts`
- Court hours service: `src/lib/modules/court-hours/services/court-hours.service.ts`
- Owner hours editor (overnight split): `src/features/owner/components/court-hours-editor.tsx`
- Owner schedule editor helpers (overnight normalization): `src/features/owner/components/court-schedule-editor/helpers.ts`
- Booking studio helpers: `src/features/owner/booking-studio/helpers.ts`

## Owner Onboarding

- Wizard definitions and steps: `src/features/owner/components/get-started/wizard/wizard-types.ts`, `src/features/owner/components/get-started/wizard/steps/`
- Wizard helpers/hooks: `src/features/owner/components/get-started/wizard/wizard-helpers.ts`, `src/features/owner/components/get-started/wizard/wizard-hooks.ts`
- Hub view: `src/features/owner/components/get-started/get-started-view.tsx`
- Owner setup status domain/use-case/router: `src/lib/modules/owner-setup/shared/domain.ts`, `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`, `src/lib/modules/owner-setup/owner-setup.router.ts`

## Team Access & Permissions

- Permission model/defaults: `src/lib/modules/organization-member/shared/permissions.ts`
- Permission checks/helpers: `src/features/owner/helpers.ts`
- Permission gate and no-access UI: `src/features/owner/components/permission-gate.tsx`, `src/features/owner/components/no-access-view.tsx`
- Team page and permission sheets/dialogs: `src/features/owner/pages/owner-team-page.tsx`, `src/features/owner/components/team-invite-dialog.tsx`, `src/features/owner/components/team-member-permissions-sheet.tsx`
- Owner sidebar nav filtering: `src/features/owner/components/owner-sidebar.tsx`
- Mobile tabs/more sheet: `src/components/layout/dashboard-bottom-tabs.tsx`, `src/features/owner/components/owner-more-sheet.tsx`
- Organization member backend service/router: `src/lib/modules/organization-member/services/organization-member.service.ts`, `src/lib/modules/organization-member/organization-member.router.ts`

## Notifications

- Delivery orchestration: `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
- Notification event schemas/content builders: `src/lib/modules/notification-delivery/shared/schemas.ts`, `src/lib/modules/notification-delivery/shared/domain.ts`
- Delivery/recipient repositories: `src/lib/modules/notification-delivery/repositories/`
- In-app inbox and delivery tables: `src/lib/shared/infra/db/schema/user-notification.ts`, `src/lib/shared/infra/db/schema/notification-delivery-job.ts`
- Notification bell/inbox UI: `src/features/notifications/components/notification-bell.tsx`, `src/features/notifications/components/notification-inbox.tsx`
- Web push settings + hook: `src/features/notifications/components/web-push-settings.tsx`, `src/features/notifications/hooks/use-web-push.ts`
- Owner routing settings: `src/features/owner/components/reservation-notification-routing-settings.tsx`

## Payments

- Organization payment methods service: `src/lib/modules/organization-payment/services/organization-payment.service.ts`
- Payment providers enums: `src/lib/shared/infra/db/schema/enums.ts`
- Owner payment methods manager UI: `src/features/owner/components/payment-methods-manager.tsx`
- Reservation payment pages/actions: `src/features/reservation/pages/reservation-payment-page.tsx`, `src/features/owner/pages/owner-reservations-page.tsx`

## Accounts & Profiles

- Auth service/router/repository: `src/lib/modules/auth/services/auth.service.ts`, `src/lib/modules/auth/auth.router.ts`, `src/lib/modules/auth/repositories/auth.repository.ts`
- Profile page/components: `src/features/account/pages/account-profile-page.tsx`, `src/features/account/components/`
- Portal switching/dropdowns: `src/features/discovery/components/user-dropdown.tsx`
- Place bookmark router/service/repository: `src/lib/modules/place-bookmark/place-bookmark.router.ts`, `src/lib/modules/place-bookmark/services/place-bookmark.service.ts`, `src/lib/modules/place-bookmark/repositories/place-bookmark.repository.ts`
- Bookmark UI + saved venues page: `src/features/discovery/components/bookmark-button.tsx`, `src/features/discovery/pages/saved-venues-page.tsx`

## Admin Operations

- Admin claims pages/hooks: `src/features/admin/pages/admin-claim-detail-page.tsx`, `src/features/admin/hooks/claims.ts`
- Admin verification pages/hooks: `src/features/admin/pages/admin-verification-detail-page.tsx`, `src/features/admin/hooks/place-verification.ts`
- Place verification admin service: `src/lib/modules/place-verification/services/place-verification-admin.service.ts`
- Claim request schema (review notes): `src/lib/shared/infra/db/schema/claim-request.ts`
