# [01-59] Reservation Chat Web Push Context

> Date: 2026-02-06
> Previous: 01-58-web-push-notifications.md

## Summary

Updated the reservation chat user story overview to explicitly reference the Web Push notification system context and the bell-driven opt-in UI entry points (header + settings pages).

## Changes Made

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/67-reservation-chat/67-00-overview.md` | Added references to the notification system plan + agent context logs; expanded the opt-in UI reference list to include the profile/settings pages that host the Web Push enable/disable card. |

## Key Decisions

- Keep “notify on new chat message” explicitly deferred until Stream webhook ingestion exists; treat Web Push as the current mechanism for reservation lifecycle and other system notifications.
- Document the bell + settings-card opt-in UI as the canonical entry points so future chat-notification stories can link to concrete implementation references.

## Commands to Continue

```bash
pnpm lint
```
