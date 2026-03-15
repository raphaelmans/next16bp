# [01-56] Sheet Close + Chat CSP

> Date: 2026-02-05
> Previous: 01-55-chat-thread-header-meta.md

## Summary

Fixed the Inbox sheet showing duplicate close (X) icons by hiding Radix Sheet's default close button when a custom header close button is present. Resolved deployed Stream Chat failures showing "The operation is insecure" (code 18) by allowing WebSockets via CSP `connect-src`.

## Changes Made

### UI

| File | Change |
|------|--------|
| `src/features/chat/components/chat-widget/owner-chat-widget.tsx` | Hide `SheetContent` default close button (`[&>button]:hidden`) to avoid duplicate X |
| `src/features/chat/components/chat-widget/player-reservation-chat-widget.tsx` | Same fix for player reservation chat sheet |

### Security / Deploy

| File | Change |
|------|--------|
| `next.config.ts` | Allow `wss:` in `connect-src` CSP so Stream Chat websocket is not blocked in production |

## Key Decisions

- Keep the existing custom header close button and suppress Radix Sheet's built-in close button (minimal UI change).
- Add `wss:` to CSP (broad enough for Stream regions) instead of hardcoding a single websocket host.

## Next Steps (if applicable)

- [ ] Verify in production: Inbox shows one close icon and there are no CSP websocket errors.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
curl -sI https://www.kudoscourts.com/ | rg -i content-security-policy
```
