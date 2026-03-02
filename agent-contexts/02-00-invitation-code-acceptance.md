---
tags:
  - agent-context
  - frontend/auth
  - frontend/owner
  - backend/organization-member
date: 2026-03-02
previous: 01-99-org-root-slug-routing.md
related_contexts:
  - "[[01-16-auth-email-templates]]"
  - "[[00-97-owner-onboarding-loop-fix]]"
---

# [02-00] Invitation Code Acceptance

> Date: 2026-03-02
> Previous: 01-99-org-root-slug-routing.md

## Summary

Reworked organization invitation acceptance from token-only links to a code-first flow for higher reliability when redirect chains or stale links occur. Added backend safeguards for invalid-code brute force attempts, updated invitation UI copy and entry UX, and introduced a migration for invitation code tracking fields. Also diagnosed a local migration-state mismatch where schema objects existed but `drizzle.__drizzle_migrations` was empty, which caused `db:migrate` to replay `0000`.

## Related Contexts

- [[01-16-auth-email-templates]] - Prior auth/invite email redirect and template hardening work.
- [[00-97-owner-onboarding-loop-fix]] - Related redirect-loop debugging patterns and guard decisions.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/organization-member/dtos/organization-member.dto.ts` | Changed invitation acceptance input from token-only shape to code-first payload. |
| `src/lib/modules/organization-member/errors/organization-member.errors.ts` | Added cooldown/lockout error for repeated invalid invitation code attempts. |
| `src/lib/modules/organization-member/organization-member.router.ts` | Mapped new invitation-code and cooldown behavior to API errors and applied sensitive rate limiting. |
| `src/lib/modules/organization-member/repositories/organization-member.repository.ts` | Added query/update methods for invitation code hash lookup, invitation-id lookup, and failed-attempt increments. |
| `src/lib/modules/organization-member/services/organization-member.service.ts` | Generated invitation codes, persisted code hash, validated by code, and enforced cooldown policy after repeated failures. |
| `src/lib/shared/infra/db/schema/organization-member.ts` | Extended invitation schema to support code-entry flow and attempt tracking. |
| `src/features/owner/pages/account-organization-invitation-accept-page.tsx` | Added invitation code input UX and fallback behavior for old token links. |
| `src/app/(auth)/account/invitations/accept/page.tsx` | Wired route boundary parsing/prefill for invitation code acceptance. |
| `src/features/owner/components/team-invite-dialog.tsx` | Updated invite guidance copy to explain code-first acceptance reliability. |
| `src/__tests__/lib/modules/organization-member/organization-member.router.test.ts` | Updated router tests for code-based acceptance contract and error behavior. |
| `drizzle/0038_invitation_code_entry.sql` | Added migration for invitation code entry support. |
| `drizzle/meta/_journal.json` | Registered new migration entry. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/02-00-invitation-code-acceptance.md` | Logged implementation summary, changed files, decisions, and continuation commands. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/auth`: `src/app/(auth)/account/invitations/accept/page.tsx`
- `frontend/owner`: `src/features/owner/pages/account-organization-invitation-accept-page.tsx`, `src/features/owner/components/team-invite-dialog.tsx`
- `backend/organization-member`: `src/lib/modules/organization-member/*`

## Key Decisions

- Moved to code-first invitation acceptance because email-link redirects can fail in local and cross-browser contexts while manual code entry remains recoverable.
- Kept compatibility for existing invite link journeys by still allowing redirect-based prefill instead of hard-breaking old links.
- Added lockout/cooldown semantics in the service layer so abuse protection lives with business rules, not only at edge/router limits.
- Treated the local migration failure as migration-history drift (schema exists, journal table empty) and used `db:push` as a local recovery path.

## Next Steps (if applicable)

- [ ] Add/expand service tests for cooldown edge cases (window reset, boundary attempt).
- [ ] Decide and document team-level recovery policy for drifted local `drizzle.__drizzle_migrations` tables.
- [ ] Run invitation acceptance manual smoke checks across fresh-session browser profiles.

## Commands to Continue

```bash
pnpm lint
pnpm exec vitest run src/__tests__/lib/modules/organization-member/organization-member.router.test.ts
pnpm exec vitest run src/__tests__/lib/modules/organization-member/services/organization-member.service.test.ts
pnpm db:push
```
