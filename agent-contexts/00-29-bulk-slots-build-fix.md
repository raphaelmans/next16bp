# [00-29] Bulk Slots Build Fix

> Date: 2026-01-13
> Previous: 00-28-court-setup-nuqs.md

## Summary

Resolved a TypeScript build error in owner slot bulk creation by safely handling unknown errors before reading the message.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Guarded error message access in bulk create handler to satisfy strict typing. |

## Key Decisions

- Prefer `error instanceof Error` checks to safely access `message` from unknown errors.

## Commands to Continue

```bash
pnpm build
pnpm lint
```
