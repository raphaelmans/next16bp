# [00-65] Guest Removal Requests

> Date: 2026-01-19
> Previous: 00-64-local-oauth-redirect.md

## Summary

Implemented guest removal requests for curated listings, including data model updates, public submission flow on the court detail page, and admin review visibility of guest contact info. Added user stories and an agent plan to document the workflow.

## Changes Made

### Data Model + Migrations

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/claim-request.ts` | Added guest metadata columns, nullable requester fields, and supporting indexes. |
| `drizzle/0003_guest_removal_request.sql` | Migration for guest fields + nullable requester and trigger user. |
| `drizzle/meta/_journal.json` | Registered migration entry. |
| `drizzle/meta/0002_snapshot.json` | Backfilled snapshot for prior migration. |
| `drizzle/meta/0003_snapshot.json` | Added claim request snapshot with guest fields. |

### Backend

| File | Change |
|------|--------|
| `src/modules/claim-request/dtos/submit-guest-removal-request.dto.ts` | Added guest removal DTO schema. |
| `src/modules/claim-request/dtos/index.ts` | Exported guest removal DTO. |
| `src/modules/claim-request/claim-request.router.ts` | Added public `submitGuestRemoval` mutation. |
| `src/modules/claim-request/services/claim-request.service.ts` | Implemented guest removal request flow + auditing. |
| `src/modules/claim-request/repositories/claim-request.repository.ts` | Added count helpers for guest dedupe. |
| `src/modules/claim-request/services/claim-admin.service.ts` | Allowed null organization for guest removals. |
| `src/modules/claim-request/use-cases/approve-claim-request.use-case.ts` | Guarded organization usage on approval. |
| `src/modules/claim-request/errors/claim-request.errors.ts` | Generalized pending request error message. |

### Public + Admin UI

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Added guest removal dialog and submit handler. |
| `src/features/admin/hooks/use-claims.ts` | Mapped guest fields and reviewer IDs in admin claims. |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Displayed guest contact details in review view. |

### Planning Artifacts

| File | Change |
|------|--------|
| `agent-plans/user-stories/18-guest-removal/18-00-overview.md` | User stories overview for guest removal. |
| `agent-plans/user-stories/18-guest-removal/18-01-guest-submits-removal-request.md` | Guest removal submission story. |
| `agent-plans/user-stories/18-guest-removal/18-02-admin-reviews-guest-removal-request-details.md` | Admin review story. |
| `agent-plans/44-guest-removal/44-00-overview.md` | Master plan for guest removal workflow. |
| `agent-plans/44-guest-removal/44-01-data-model.md` | Data model plan. |
| `agent-plans/44-guest-removal/44-02-backend-api.md` | Backend API plan. |
| `agent-plans/44-guest-removal/44-03-public-ui.md` | Public UI plan. |
| `agent-plans/44-guest-removal/44-04-admin-review.md` | Admin review plan. |

## Key Decisions

- Reused the `claim_request` table and admin flow instead of a new removal table to minimize surface area.
- Allowed `requestedByUserId`, `organizationId`, and event `triggeredByUserId` to be nullable for guest requests.
- Used a public, rate-limited mutation for guest submissions to avoid authentication requirements.

## Next Steps (if applicable)

- [ ] Run `pnpm build` (or `TZ=UTC pnpm build`) to validate build output.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
