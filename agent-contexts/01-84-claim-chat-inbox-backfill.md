# [01-84] Claim Chat Inbox Backfill

> Date: 2026-02-12
> Previous: 01-83-agent-context-checkpoint.md

## Summary

Implemented support-chat provisioning changes so claim request threads are created with admin membership and become visible in the admin inbox immediately. Added an admin backfill mutation and wired the inbox UI to trigger it on open for reconciling older pending claims.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/chat/services/support-chat.service.ts` | Added reusable claim-thread provisioning helpers, admin-recipient member resolution, and pending-claim backfill workflow with processed/skipped/failed counters. |
| `src/lib/modules/chat/factories/support-chat.factory.ts` | Injected notification-recipient repository dependency into support chat service construction. |
| `src/lib/modules/chat/support-chat.router.ts` | Added admin-only `backfillClaimThreads` mutation that runs pending-claim chat provisioning. |
| `src/lib/modules/claim-request/claim-request.router.ts` | Added best-effort chat provisioning after successful claim submission, with warning log on failure and non-blocking claim submit behavior. |
| `src/features/support-chat/components/support-inbox-widget.tsx` | Triggered claim-thread backfill once per inbox open and refreshed channels on completion; simplified empty-state copy. |
| `.opencode/plans/1770827530529-gentle-knight.md` | Updated plan to reflect eager claim-chat provisioning + admin backfill design and verification path. |

## Key Decisions

- Kept claim submission resilient by treating chat provisioning as best-effort and logging failures instead of failing the mutation.
- Centralized claim-thread creation in one service path so lazy session fetch and eager/backfill flows stay consistent and idempotent.
- Used admin inbox open as a practical trigger for backfilling pending claims, then refetched channels for immediate visibility.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` to validate type/lint correctness for router/service/UI changes.
- [ ] Verify two-path behavior manually: new claim submission visibility and legacy pending-claim backfill visibility in admin inbox.
- [ ] Confirm multi-admin membership visibility for backfilled and newly provisioned claim channels.

## Commands to Continue

```bash
git status --short
git diff -- src/lib/modules/chat/services/support-chat.service.ts
git diff -- src/lib/modules/claim-request/claim-request.router.ts
pnpm lint
pnpm dev
```
