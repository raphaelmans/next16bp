## Context

The current notification-delivery flow can enqueue SMS jobs for organization-directed reservation lifecycle and review events, but it has no organization-level recipient cap and no quota or plan model. Reservation routing today is team-based, while some other organization-side SMS flows resolve through owner/contact fallbacks, so cost exposure is spread across multiple code paths.

The business goal is to make SMS a controlled paid capability: `FREE` organizations get a small allowance, `BUSINESS_PLUS` organizations get a higher allowance, and all organization-side SMS routes through one resolved individual only. At the same time, the implementation should not lock us into a manual-only plan model because future subscription syncing is expected.

## Goals / Non-Goals

**Goals:**
- Cap organization-side SMS delivery to one resolved recipient per event.
- Support an explicit organization SMS assignee chosen from active members.
- Fall back to the organization owner when the configured assignee is missing or invalid.
- Enforce SMS quotas per organization per billing cycle.
- Establish a reusable quota foundation for future costly services.
- Support manual admin plan assignment now, while preserving a clean adapter seam for future Stripe or vendor-backed plan resolution.

**Non-Goals:**
- No application code implementation in this change package.
- No changes to inbox, email, web push, or mobile push delivery fanout.
- No changes to admin-targeted SMS flows such as verification requests sent to admins.
- No owner-facing billing portal or self-serve subscription purchase flow.
- No generalized entitlements engine beyond the minimum needed for quota-governed costly services.

## Decisions

### 1. Use an organization-level SMS policy instead of reusing per-user reservation toggles

**Decision:** Add a dedicated organization notification policy record with a nullable `smsRecipientUserId` rather than overloading the current per-user reservation notification preference.

This keeps the existing reservation routing toggle focused on multi-transport operational notifications and makes the SMS cost-control rule explicit: one organization, one SMS recipient. It also avoids ambiguous interactions where multiple users are opted into reservation notifications but only one may receive SMS.

**Alternative considered:** Reuse the current per-user reservation notification preference and pick the first enabled user. Rejected because it makes SMS routing incidental and unstable, and it couples a new pricing rule to a feature that was designed for operational fanout.

### 2. Model plan state through a plan-source adapter with a manual first-party implementation

**Decision:** Introduce a plan-source interface that returns the organization’s current plan and billing-cycle window. Implement v1 with app-owned plan assignment data and expose admin APIs/UI to manage it manually.

This keeps the quota engine insulated from where plan truth comes from. Manual assignment is enough for the immediate rollout, but the adapter makes it straightforward to introduce a Stripe-backed implementation later without rewriting notification delivery or quota checks.

**Alternative considered:** Hard-code quotas from environment config or org allowlists only. Rejected because it does not create a durable product concept for `BUSINESS_PLUS` and makes future vendor sync a breaking redesign.

### 3. Persist plan assignment separately from generic organization profile data

**Decision:** Use dedicated organization plan-assignment persistence that stores plan, source, effective timestamp, and billing-cycle anchor metadata.

A separate model is a better fit than adding one enum column on an existing organization profile record because quota evaluation needs billing-cycle context and later vendor metadata. The manual implementation can still stay simple while leaving room for provider ids or sync state later.

**Alternative considered:** Add `plan` directly to an existing organization or organization-profile row. Rejected because it leaves billing-cycle state underspecified and makes later provider backfill more awkward.

### 4. Use a generic usage ledger for costly services and count successful sends

**Decision:** Add a reusable organization service-usage ledger keyed by organization, service, billing window, and source reference. Record usage only after SMS provider acceptance, not at enqueue time.

This keeps quotas accurate even when jobs are retried, skipped, or fail before provider acceptance. It also creates a clear extension point for future costly services beyond SMS.

**Alternative considered:** Count SMS quota directly from notification-delivery jobs. Rejected because delivery jobs mix attempts, statuses, and transport concerns, and they do not provide a clean reusable abstraction for future costly services.

### 5. Enforce quotas at SMS dispatch time, not only at enqueue time

**Decision:** Perform the quota check immediately before provider send and mark the SMS delivery as skipped when the organization is out of quota.

Dispatch-time enforcement uses the freshest usage state inside the active billing window and avoids overcounting queued but unsent jobs. Pending jobs may still exist in the queue, but only successful provider sends consume quota.

**Alternative considered:** Prevent SMS job creation at enqueue time. Rejected because usage can change between enqueue and send, especially with queued retries or concurrent reservations.

### 6. Scope the single-recipient rule to organization-side SMS only

**Decision:** Apply single-recipient routing and quota enforcement to organization-side SMS for reservation-created and owner-review outcomes, but leave admin-targeted SMS untouched.

This matches the cost-optimization goal without changing unrelated operational/admin communication flows.

**Alternative considered:** Apply quota/routing to every SMS in the system immediately. Rejected because admin-side SMS is a different operational concern and was not part of the business request.

### 7. Stop using shared organization contact phone numbers for quota-governed SMS

**Decision:** Organization-side SMS must route only to the resolved individual user’s profile phone number.

The new policy is explicitly about “one individual only.” Shared organization contact phone numbers are still valid for non-SMS contact surfaces, but they should not remain a hidden SMS fallback once quotas and plan packaging are introduced.

**Alternative considered:** Keep `organizationProfile.contactPhone` as an SMS fallback. Rejected because it breaks the one-individual policy and makes quota-governed delivery less predictable.

## Risks / Trade-offs

- **[Manual plan assignment can drift from future vendor truth]** → Mitigation: store assignment source and billing anchor explicitly, and keep plan resolution behind an adapter so vendor sync can replace manual resolution cleanly later.
- **[Queued SMS jobs can be skipped after enqueue if quota is exhausted before dispatch]** → Mitigation: accept this as correct hard-stop behavior, log structured quota events, and treat dispatch-time enforcement as the source of truth.
- **[Organizations may lose SMS unexpectedly if assignee or owner has no phone number]** → Mitigation: owner settings must surface whether the resolved recipient currently has a phone number.
- **[Adding multiple new persistence models increases rollout complexity]** → Mitigation: keep v1 scope limited to SMS as the only quota-governed service and avoid broader entitlements work in this change.

## Migration Plan

1. Add persistence for organization SMS policy, organization plan assignment, and organization service-usage ledger.
2. Backfill existing organizations to `FREE` with a manual source and an initial billing-cycle anchor set at rollout time.
3. Default all organizations to owner fallback by leaving `smsRecipientUserId` unset until explicitly configured.
4. Add plan-resolution and quota-evaluation contracts before changing notification-delivery behavior.
5. Add admin plan assignment UI/API and owner SMS assignee UI/API.
6. Update organization-side SMS flows to resolve one recipient and enforce quota at dispatch time.
7. Validate the change package and review the specs before any code implementation starts.

Rollback:
- Revert notification-delivery call sites to current SMS routing behavior.
- Leave new plan/policy/usage persistence in place as dormant data if rollback is needed before archive.

## Open Questions

None.
