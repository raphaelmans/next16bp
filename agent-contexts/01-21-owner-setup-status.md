# [01-21] Owner Setup Status API

> Date: 2026-01-28
> Previous: 01-20-schedule-apply-to-all.md

## Summary

Implemented a centralized owner setup status endpoint and adopted it in the owner setup hub and dashboard, including a recovery CTA when setup is incomplete. Added planning artifacts for the new workstream.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/modules/owner-setup/dtos/owner-setup-status.dto.ts` | Added shared types for owner setup status + next step. |
| `src/modules/owner-setup/dtos/index.ts` | Exported owner setup status types. |
| `src/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts` | Centralized setup status computation (org/place/verification/courts/claims). |
| `src/modules/owner-setup/factories/owner-setup.factory.ts` | Wired use-case factory with repositories. |
| `src/modules/owner-setup/owner-setup.router.ts` | Added `ownerSetup.getStatus` tRPC endpoint. |
| `src/shared/infra/trpc/root.ts` | Registered `ownerSetup` router. |
| `src/features/owner/hooks/use-owner-setup-status.ts` | New hook for centralized status query. |
| `src/features/owner/hooks/index.ts` | Exported `useOwnerSetupStatus`. |
| `src/app/(auth)/owner/get-started/page.tsx` | Replaced local setup inference with centralized status and invalidation. |
| `src/app/(owner)/owner/page.tsx` | Added dashboard CTA for incomplete setup. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/74-owner-setup-status/74-00-overview.md` | Added implementation overview + scope. |
| `agent-plans/74-owner-setup-status/74-01-owner-setup-status-api.md` | Detailed API phase plan. |
| `agent-plans/74-owner-setup-status/74-02-owner-setup-status-client.md` | Detailed client phase plan. |
| `agent-plans/74-owner-setup-status/owner-setup-status-server-dev1-checklist.md` | Server checklist. |
| `agent-plans/74-owner-setup-status/owner-setup-status-client-dev1-checklist.md` | Client checklist. |
| `agent-plans/context.md` | Logged new plan entry. |

## Key Decisions

- Centralized owner setup validation in a dedicated use-case to ensure consistent status across UI pages.
- Treat pending claim as "venue in progress" without marking setup complete until verification + active court are present.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run `TZ=UTC pnpm build`.

## Commands to Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
