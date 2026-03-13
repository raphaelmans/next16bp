# Source Files

_Engineering reference for the guide-aligned core-features doc set. Code remains the source of truth._

## Primary Guide-Aligned Docs

### 01. Player Discovery & Venue Shortlisting

- Public discovery pages and clients: `src/features/discovery/pages/`, `src/features/discovery/components/`
- Discovery hooks and filters: `src/features/discovery/hooks.ts`, `src/features/discovery/hooks/`
- Public courts discovery server surface: `src/features/discovery/server/public-courts-discovery.tsx`
- Venue detail pages and sections: `src/features/discovery/pages/place-detail-page.tsx`, `src/features/discovery/place-detail/components/`
- Review aggregate and trust signals: `src/features/discovery/place-detail/components/place-detail-review-aggregate-provider.tsx`
- Map/list surfaces: `src/features/discovery/components/courts-page-client.tsx`, `src/features/discovery/components/court-map.tsx`
- Availability range helpers: `src/features/discovery/place-detail/helpers/cross-week-range.ts`, `src/features/discovery/place-detail/helpers/booking-cart-rules.ts`

### 02. Player Booking & Reservation Tracking

- Reservation status enums and schema: `src/lib/shared/infra/db/schema/enums.ts`, `src/lib/shared/infra/db/schema/reservation.ts`
- Player reservation service: `src/lib/modules/reservation/services/reservation.service.ts`
- Owner reservation actions: `src/lib/modules/reservation/services/reservation-owner.service.ts`
- Reservation status aggregation helpers: `src/lib/modules/reservation/shared/domain.ts`
- Player reservation UI and tabs: `src/features/reservation/pages/`, `src/features/reservation/components/reservation-tabs.tsx`, `src/features/reservation/hooks.ts`
- Reservation sync and realtime invalidation: `src/features/reservation/sync.ts`

### 03. Owner Listing & Venue Operations

- Place management service and router: `src/lib/modules/place/services/place-management.service.ts`, `src/lib/modules/place/place-management.router.ts`
- Court management service and router: `src/lib/modules/court/services/court-management.service.ts`, `src/lib/modules/court/court-management.router.ts`
- Place verification flows: `src/lib/modules/place-verification/services/`, `src/features/owner/pages/owner-place-verification-page.tsx`
- QR code surface: `src/features/owner/components/venue-qr-code-dialog.tsx`
- Booking studio helpers: `src/features/owner/booking-studio/helpers.ts`

### 04. Owner Setup & Go Live

- Wizard definitions and step implementations: `src/features/owner/components/get-started/wizard/wizard-types.ts`, `src/features/owner/components/get-started/wizard/steps/`
- Wizard helpers and hooks: `src/features/owner/components/get-started/wizard/wizard-helpers.ts`, `src/features/owner/components/get-started/wizard/wizard-hooks.ts`
- Hub view and get-started client: `src/features/owner/components/get-started/get-started-view.tsx`, `src/features/owner/components/owner-get-started-page-client.tsx`
- Owner setup status domain/use case/router: `src/lib/modules/owner-setup/shared/domain.ts`, `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`, `src/lib/modules/owner-setup/owner-setup.router.ts`

## Supporting Operational References

### Team Access & Permissions

- Permission model/defaults: `src/lib/modules/organization-member/shared/permissions.ts`
- Team management UI: `src/features/owner/pages/owner-team-page.tsx`, `src/features/owner/components/team-invite-dialog.tsx`, `src/features/owner/components/team-member-permissions-sheet.tsx`
- Permission-aware owner UI: `src/features/owner/components/permission-gate.tsx`, `src/features/owner/components/no-access-view.tsx`, `src/features/owner/helpers.ts`
- Owner mobile navigation: `src/components/layout/dashboard-bottom-tabs.tsx`, `src/features/owner/components/owner-more-sheet.tsx`

### Notifications

- Delivery orchestration: `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
- Notification schemas and event builders: `src/lib/modules/notification-delivery/shared/schemas.ts`, `src/lib/modules/notification-delivery/shared/domain.ts`
- Delivery repositories and job tables: `src/lib/modules/notification-delivery/repositories/`, `src/lib/shared/infra/db/schema/user-notification.ts`, `src/lib/shared/infra/db/schema/notification-delivery-job.ts`
- Notification UI: `src/features/notifications/components/notification-bell.tsx`, `src/features/notifications/components/notification-inbox.tsx`
- Web push and routing settings: `src/features/notifications/components/web-push-settings.tsx`, `src/features/notifications/hooks/use-web-push.ts`, `src/features/owner/components/reservation-notification-routing-settings.tsx`

### Open Play

- Open play services and schema: `src/lib/modules/open-play/services/`, `src/lib/shared/infra/db/schema/open-play.ts`, `src/lib/shared/infra/db/schema/external-open-play.ts`
- Open play pages and components: `src/features/open-play/pages/`, `src/features/open-play/components/`, `src/features/open-play/hooks.ts`
- Reservation-side open-play setup: `src/features/reservation/components/reservation-actions-card.tsx`, `src/features/reservation/pages/place-booking-page.tsx`

### Chat & Messaging

- Chat services and providers: `src/lib/modules/chat/services/`, `src/lib/modules/chat/providers/`
- Reservation chat schema: `src/lib/shared/infra/db/schema/reservation-chat.ts`
- Open-play chat schema: `src/lib/shared/infra/db/schema/open-play-chat.ts`
- Owner reservation inbox widget: `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`

### Payments

- Organization payment methods service and DTOs: `src/lib/modules/organization-payment/services/organization-payment.service.ts`, `src/lib/modules/organization-payment/dtos/organization-payment-method.dto.ts`
- Payment providers enum: `src/lib/shared/infra/db/schema/enums.ts`
- Payment proof service: `src/lib/modules/payment-proof/services/payment-proof.service.ts`
- Player payment surfaces: `src/features/reservation/pages/reservation-payment-page.tsx`, `src/features/reservation/components/payment-instructions.tsx`
- Owner payment review surfaces: `src/features/owner/pages/owner-reservations-page.tsx`, `src/features/owner/pages/owner-reservation-detail-page.tsx`

### Accounts & Profiles

- Auth service/router/repository: `src/lib/modules/auth/services/auth.service.ts`, `src/lib/modules/auth/auth.router.ts`, `src/lib/modules/auth/repositories/auth.repository.ts`
- Profile and home pages: `src/features/account/pages/account-profile-page.tsx`, `src/features/account/components/`, `src/features/home/components/`
- Saved venues and bookmarks: `src/lib/modules/place-bookmark/`, `src/features/discovery/components/bookmark-button.tsx`, `src/features/discovery/pages/saved-venues-page.tsx`
- Portal preference and auth flows: `src/features/auth/components/portal-switcher.tsx`, `src/features/auth/components/portal-preference-card.tsx`, `src/features/auth/components/magic-link-form.tsx`

### Admin Operations

- Admin dashboard stats hooks: `src/features/admin/hooks/organization.ts`
- Claims pages and hooks: `src/features/admin/pages/admin-claim-detail-page.tsx`, `src/features/admin/hooks/claims.ts`
- Verification pages and hooks: `src/features/admin/pages/admin-verification-detail-page.tsx`, `src/features/admin/hooks/place-verification.ts`
- Review moderation: `src/features/admin/components/admin-reviews-list.tsx`
- Admin tools: `src/features/admin/pages/admin-notification-test-page.tsx`, `src/features/admin/pages/admin-revalidate-page.tsx`

## Related Canonical Doc Sets

- Developer integration overview: `important/developer-integration/00-overview.md`
- Developer integration source files: `important/developer-integration/99-source-files.md`
