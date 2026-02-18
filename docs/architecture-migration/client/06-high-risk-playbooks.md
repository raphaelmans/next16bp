# High-Risk Playbooks

## Purpose

Provide deterministic execution playbooks for the largest and highest-risk frontend files.

## Risk Tier 1: Owner Bookings and Availability Pages

### Current High-Risk Files

- `src/app/(owner)/owner/bookings/page.tsx`
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`

### Why High Risk

- Very large files with many transport calls and UI concerns.
- Complex sequencing (mutations + invalidation + calendar/grid state).
- Heavy usage in owner daily operations.

### File Split Strategy

Create feature-owned modules:

- `src/features/owner/components/owner-bookings-page-view.tsx`
- `src/features/owner/components/owner-availability-page-view.tsx`
- `src/features/owner/hooks/bookings-hooks.ts`
- `src/features/owner/hooks/availability-hooks.ts`
- `src/features/owner/hooks/guest-booking-hooks.ts`
- `src/features/owner/hooks/block-management-hooks.ts`

### Step-by-Step

1. Move render sections to `owner-*-page-view` components without changing behavior.
2. Keep route files as param parsing + view composition only.
3. Extract related query/mutation units into split hook files.
4. Introduce `useModOwnerBookingsPage()` and `useModOwnerAvailabilityPage()` composed hooks.
5. Centralize invalidation helpers per domain action (block create/update/cancel, booking create/convert).
6. Re-run owner bookings and availability smoke scenarios.

### Done Criteria

- Route files no longer own transport orchestration.
- Split hooks follow naming standards.
- Owner bookings/availability parity confirmed.

## Risk Tier 1: Owner API/Hook Monolith

### Current High-Risk File

- `src/features/owner/hooks.ts`

### Why High Risk

- 45 direct tRPC hook usages in one file.
- Mixed responsibilities across places/courts/bookings/payments/verification.

### Hook Decomposition Plan

Split by domain responsibility:

- `src/features/owner/hooks/places-hooks.ts`
- `src/features/owner/hooks/courts-hooks.ts`
- `src/features/owner/hooks/court-hours-hooks.ts`
- `src/features/owner/hooks/court-pricing-hooks.ts`
- `src/features/owner/hooks/reservations-hooks.ts`
- `src/features/owner/hooks/bookings-import-hooks.ts`
- `src/features/owner/hooks/place-verification-hooks.ts`
- `src/features/owner/hooks/index.ts` (re-export surface)

Add `src/features/owner/api.ts` with sub-domain methods and composed factory wiring.

### Step-by-Step

1. Introduce `IOwnerApi` and deps types.
2. Move one domain at a time from monolith hooks to split modules.
3. If temporary compatibility exports are needed during refactor, keep them branch-local and track explicit deletion before cutover.
4. Update call sites incrementally.
5. Remove all compatibility exports before cutover gate runs.

### Done Criteria

- No monolithic owner hook file remains.
- Owner hook modules are SRP-aligned and consistently named.

## Risk Tier 1: Admin Hook/View Complexity

### Current High-Risk Files

- `src/features/admin/hooks.ts`
- `src/features/admin/components/admin-courts-batch-view.tsx`
- `src/features/admin/components/admin-court-edit-view.tsx`

### Why High Risk

- Dense mutation and query graph with admin-only side effects.
- Large multi-purpose views likely to regress with broad edits.

### File Split Strategy

- `src/features/admin/hooks/courts-hooks.ts`
- `src/features/admin/hooks/claims-hooks.ts`
- `src/features/admin/hooks/place-verification-hooks.ts`
- `src/features/admin/hooks/organization-hooks.ts`
- `src/features/admin/hooks/index.ts`
- `src/features/admin/components/courts/` subfolder for batch/edit sub-sections

### Step-by-Step

1. Extract claim and verification hooks first (lowest coupling to batch forms).
2. Extract court mutation/query hooks second.
3. Split batch and edit views into section components.
4. Replace direct calls in sections with feature hooks.
5. Validate admin claims/verification/courts tool matrix.

### Done Criteria

- Admin hooks are split by subdomain.
- Large views are sectioned and transport-free.

## Risk Tier 1: Chat Widgets and Unified Interface

### Current High-Risk Files

- `src/features/chat/components/unified-chat/unified-chat-interface.tsx`
- `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`
- `src/features/chat/components/ReservationChatClient.tsx`
- `src/features/chat/components/ChatPocClient.tsx`

### Why High Risk

- Stateful real-time UX.
- Multiple mutation/query paths and provider coordination.

### File Split Strategy

- `src/features/chat/hooks/reservation-chat-hooks.ts`
- `src/features/chat/hooks/support-chat-hooks.ts`
- `src/features/chat/hooks/open-play-chat-hooks.ts`
- `src/features/chat/components/unified-chat/sections/*.tsx`
- `src/features/chat/components/chat-widget/sections/*.tsx`

### Step-by-Step

1. Extract transport calls to dedicated hooks.
2. Keep message rendering components presentation-only.
3. Introduce composed chat modules (`useModChatInbox`, `useModSupportChatSession`).
4. Preserve ordering/timing semantics for send-message actions.
5. Validate chat session auth/send/refresh behavior on owner/admin/player paths.

### Done Criteria

- Chat UI components no longer call tRPC directly.
- Chat flow parity validated end-to-end.

## Cross-Playbook Guardrails

For all high-risk playbooks:

1. Do not mix behavior changes with architecture changes.
2. Keep extraction commits small and reviewable.
3. Any temporary compatibility export requires an explicit removal task in `00-overview.md` before cutover.
4. Track each playbook with entry/exit checklist in PR description.
