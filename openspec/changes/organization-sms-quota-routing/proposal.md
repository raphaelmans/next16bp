## Why

Organization-side SMS notifications currently fan out based on routing rules without any organization-level cost controls. That makes SMS spend unpredictable and blocks us from packaging SMS as a paid Business Plus capability with plan-based limits.

## What Changes

- Add organization-level SMS routing so each organization has at most one resolved SMS recipient.
- Allow organizations to configure a single active member as the SMS assignee, with owner fallback when no valid assignee is configured.
- Introduce organization plans with initial tiers `FREE` and `BUSINESS_PLUS`.
- Add per-plan SMS quotas enforced per organization billing cycle, with hard-stop behavior when the quota is exhausted.
- Add a generic quota foundation for future costly services while implementing SMS as the first consumer.
- Add admin plan assignment tooling so staff can manually place organizations on `BUSINESS_PLUS` before subscription-vendor integration exists.
- Keep inbox, email, web push, and mobile push behavior unchanged.
- Keep admin-targeted SMS flows outside this change.

## Capabilities

### New Capabilities
- `organization-sms-routing`: Single-recipient organization SMS routing with explicit assignee selection and owner fallback.
- `organization-service-quotas`: Billing-cycle quota policy and usage enforcement for costly organization services, with SMS as the first service.
- `organization-plan-management`: Manual organization plan assignment and plan-context resolution for quota evaluation.

### Modified Capabilities

None.

## Impact

- **Notification delivery**: Reservation-created, claim-reviewed, and verification-reviewed SMS routing behavior changes from recipient fanout to single-recipient resolution.
- **Organization data**: New plan-assignment, notification-policy, and usage-ledger persistence is required.
- **Owner settings**: Add an organization SMS routing control distinct from the existing per-user reservation notification toggle.
- **Admin tooling**: Add admin plan assignment API/UI so internal staff can manage `FREE` vs `BUSINESS_PLUS`.
- **Future billing integration**: Introduce a plan-source adapter boundary so manual assignment can later be replaced or augmented by Stripe or another subscription provider.
