# [01-60] Support Chat Implementation

> Date: 2026-02-06
> Previous: 01-59-reservation-chat-push-context.md

## Summary

Implemented an owner<->admin support chat flow for claim + verification review, backed by a dedicated `support_chat_thread` table and Stream Chat channels. Wired end-to-end support chat session creation through a new tRPC router/service/repository, and exposed the UI via right-side sheets in owner and admin review surfaces.

## Changes Made

### Database

| File | Change |
|------|--------|
| `drizzle/0023_support_chat.sql` | Added `support_chat_thread` table + constraints/indexes for claim/verification threading. |
| `src/lib/shared/infra/db/schema/support-chat.ts` | Added Drizzle schema + Zod schemas for `support_chat_thread`. |

### Chat Provider (Stream)

| File | Change |
|------|--------|
| `src/lib/modules/chat/providers/chat.provider.ts` | Added `ensureSupportChannel` contract for support chat channel provisioning. |
| `src/lib/modules/chat/providers/stream-chat.provider.ts` | Implemented `ensureSupportChannel` with idempotent create + member management (`addMembers`). |
| `src/lib/modules/chat/helpers/claim-support-channel-id.ts` | Deterministic channel ID builder for claim threads. |
| `src/lib/modules/chat/helpers/verification-support-channel-id.ts` | Deterministic channel ID builder for verification threads. |

### Support Chat Backend (tRPC + service/repo)

| File | Change |
|------|--------|
| `src/lib/modules/chat/support-chat.router.ts` | Added `supportChat` procedures for claim/verification chat sessions. |
| `src/lib/modules/chat/services/support-chat.service.ts` | Orchestrated thread upsert + Stream channel ensure for claim + verification flows. |
| `src/lib/modules/chat/repositories/support-chat-thread.repository.ts` | Added query/upsert helpers for `support_chat_thread` keyed by request ID. |
| `src/lib/modules/chat/errors/support-chat.errors.ts` | Centralized access/authorization errors for support chat. |
| `src/lib/modules/chat/factories/support-chat.factory.ts` | Factory wiring for repo + service construction. |
| `src/lib/shared/infra/trpc/root.ts` | Registered `supportChat` router in the app tRPC root. |

### UI (Sheets + Entry Points)

| File | Change |
|------|--------|
| `src/features/support-chat/components/support-chat-sheet.tsx` | Added sheet UI that fetches a support chat session and renders the chat panel. |
| `src/app/(auth)/owner/get-started/page.tsx` | Added “Message admin” entry point for owners during onboarding/review states. |
| `src/features/owner/components/place-verification-panel.tsx` | Added “Message admin” entry point in the verification panel. |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Added support chat sheet in claim review page for admin-owner thread access. |
| `src/app/(admin)/admin/verification/[requestId]/page.tsx` | Added support chat sheet in verification review page for admin-owner thread access. |

### Admin Header

| File | Change |
|------|--------|
| `src/features/admin/components/admin-navbar.tsx` | Added notification bell to admin header/navigation. |
| `src/features/notifications/components/notification-bell.tsx` | Notification bell UI used by the admin portal. |

## Key Decisions

- Stored support chat thread metadata in `support_chat_thread` with a single-request check constraint (claim XOR verification) to keep threading unambiguous.
- Used deterministic Stream channel IDs derived from request IDs so channels can be recreated/ensured idempotently.
- Exposed support chat as a `Sheet` UI to keep owners/admins in-context during verification/claim workflows.

## Next Steps (if applicable)

- [ ] Add/verify RLS + authorization coverage for `support_chat_thread` access patterns (owner vs admin).
- [ ] Add a small manual QA checklist for: create thread, refresh, resume, and member access.

## Commands to Continue

```bash
pnpm db:migrate
pnpm dev
pnpm lint
```
