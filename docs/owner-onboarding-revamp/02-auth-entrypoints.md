# Auth Entry Points

This spec defines how player vs owner intent is captured during registration.

## Principles

- Reduce decisions for users with clear intent.
- Provide role selection only when intent is unknown.
- Keep auth mechanics shared so magic links and OAuth do not bypass business logic.

## /register/owner (Owner-specific)

When to use:
- Primary CTA destination from `/owners/get-started`.

Behavior:
- No Player vs Owner chooser.
- Default redirect is `/owner/get-started`.

Copy requirements:
- State expectation: verification is required before enabling online reservations.

## /register (General)

When to use:
- Organic signups with no clear intent.

Role chooser:
- Show a Player vs Owner selection card ONLY if the URL does not already imply owner intent.

Intent detection rule of thumb:

```text
If query has redirect=/owner/*  => owner intent is known; hide chooser.
Else                           => show chooser.
```

Chooser UX:
- Two cards:
  - Player: "Book courts" (default)
  - Owner: "Manage a venue" (sets redirect to /owner/get-started)

## Why not separate auth systems?

Because magic link and OAuth can create users outside the traditional register endpoint. We still need a post-auth setup hub (`/owner/get-started`) that can finalize owner intent.
