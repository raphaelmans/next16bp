# Source Files

_This file is an engineering reference. It maps each document section to the relevant source files for implementation work._

## Onboarding Flow (01)

- Wizard step definitions: `src/features/owner/components/get-started/wizard/wizard-types.ts`
- Wizard logic (skip, complete, navigation): `src/features/owner/components/get-started/wizard/wizard-helpers.ts`
- Wizard URL state and auto-skip: `src/features/owner/components/get-started/wizard/wizard-hooks.ts`
- Main wizard component: `src/features/owner/components/get-started/wizard/setup-wizard.tsx`
- Step components: `src/features/owner/components/get-started/wizard/steps/` (7 files)
- Hub view: `src/features/owner/components/get-started/get-started-view.tsx`
- Hub hooks and helpers: `src/features/owner/components/get-started/get-started-hooks.ts`, `get-started-helpers.ts`
- Hub section cards: `src/features/owner/components/get-started/sections/` (11 files)
- Setup status backend: `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`
- Setup status domain logic: `src/lib/modules/owner-setup/shared/domain.ts`
- Setup status router: `src/lib/modules/owner-setup/owner-setup.router.ts`
- Setup status DTO: `src/lib/modules/owner-setup/dtos/owner-setup-status.dto.ts`
- Owner page: `src/features/owner/pages/owner-get-started-page.tsx`
- Owner layout (auth + org check): `src/app/(owner)/layout.tsx`

## Team Access & Permissions (02)

- Permission definitions and role hierarchy: `src/lib/modules/organization-member/shared/permissions.ts`
- Permission gate component: `src/features/owner/components/permission-gate.tsx`
- No-access fallback: `src/features/owner/components/no-access-view.tsx`
- Page access rules and helpers: `src/features/owner/helpers.ts`
- Sidebar nav filtering: `src/features/owner/components/owner-sidebar.tsx`
- Mobile bottom tabs (role-based): `src/features/owner/components/owner-bottom-tabs.tsx`
- Mobile more sheet: `src/features/owner/components/owner-more-sheet.tsx`
- Team management UI: `src/features/owner/components/team-access-manager.tsx`
- Invite dialog: `src/features/owner/components/team-invite-dialog.tsx`
- Permission edit sheet: `src/features/owner/components/team-member-permissions-sheet.tsx`
- Backend service: `src/lib/modules/organization-member/services/organization-member.service.ts`
- Backend router: `src/lib/modules/organization-member/organization-member.router.ts`
- Permission context hook: `src/features/owner/hooks/organization.ts` (useModOwnerPermissionContext)

## Notification System (03)

- Notification delivery service: `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
- Notification content builders: `src/lib/modules/notification-delivery/shared/domain.ts`
- Notification schemas: `src/lib/modules/notification-delivery/shared/schemas.ts`
- Recipient resolution: `src/lib/modules/notification-delivery/repositories/notification-recipient.repository.ts`
- Delivery job queue: `src/lib/modules/notification-delivery/repositories/notification-delivery-job.repository.ts`
- Push subscription storage: `src/lib/shared/infra/db/schema/push-subscription.ts`
- Mobile push token storage: `src/lib/shared/infra/db/schema/mobile-push-token.ts`
- In-app inbox table: `src/lib/shared/infra/db/schema/user-notification.ts`
- Delivery job table: `src/lib/shared/infra/db/schema/notification-delivery-job.ts`
- Notification preference table: `src/lib/shared/infra/db/schema/organization-member.ts`
- Notification bell UI: `src/features/notifications/components/notification-bell.tsx`
- Notification inbox UI: `src/features/notifications/components/notification-inbox.tsx`
- Web push settings UI: `src/features/notifications/components/web-push-settings.tsx`
- Notification routing settings: `src/features/owner/components/reservation-notification-routing-settings.tsx`
- Web push hook: `src/features/notifications/hooks/use-web-push.ts`
- Notification preference hooks: `src/features/owner/hooks/organization.ts`
- Routing domain logic: `src/lib/modules/organization-member/shared/domain.ts`
- Cron dispatch endpoint: `src/app/api/cron/dispatch-notification-delivery/`
- Queue dispatch endpoint: `src/app/api/internal/queue/dispatch-notification-delivery/`
- Reservation alerts panel: `src/features/owner/components/reservation-alerts-panel.tsx`

## Owner Shell and Navigation

- Owner shell (layout): `src/features/owner/components/owner-shell.tsx`
- Owner navbar: `src/features/owner/components/owner-navbar.tsx`
- App routes: `src/common/app-routes.ts`
