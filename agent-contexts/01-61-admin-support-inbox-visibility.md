# [01-61] Admin Support Inbox Visibility

> Date: 2026-02-06
> Previous: 01-60-support-chat-implementation.md

## Summary

Fixed admin global support inbox visibility by removing an early `null` return when chat auth fails. The support inbox widget now remains mounted across admin routes and shows an inline error state instead of disappearing.

## Changes Made

### UI Behavior

| File | Change |
|------|--------|
| `src/features/support-chat/components/support-inbox-widget.tsx` | Removed early `null` return on chat auth error and preserved widget rendering with inline error feedback. |

## Key Decisions

- Prioritized persistent widget visibility across admin routes, even when chat authentication fails.
- Switched from hard-fail hiding behavior to an inline error state to keep support inbox discoverable and debuggable.

## Next Steps (if applicable)

- [ ] Manually verify the widget remains visible on all admin routes during chat auth failures.
- [ ] Confirm inline error messaging is clear and non-blocking for admin users.

## Commands to Continue

```bash
pnpm dev
pnpm lint
```
