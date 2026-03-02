# Default Portal Routing (Owner vs Player)

Problem: owners often land on `/home` (player portal) after login unless they arrive via an explicit owner redirect.

## Goal

After login/signup, if there is no explicit redirect, route owners to `/owner` by default.

## Redirect Precedence Rules

```text
1) If an explicit redirect query param exists => always honor it.
2) Else if user default portal is organization AND user has an organization => /owner
3) Else => /home
```

Rationale:
- Booking flows and deep links must not break.
- Mixed users should not be hijacked away from their preferred portal.

## Data Requirement

We need a server-readable default portal preference (not localStorage).

Recommended:
- Persist `defaultPortal = organization | player` in a DB row that is 1:1 with user.
- Set it to organization only when the user takes a durable owner action (organization created) or explicitly chooses owner intent.

## UX Implications

- Owner setup hub and/or organization creation should set `defaultPortal=organization`.
- Users should be able to change default portal later in settings.
