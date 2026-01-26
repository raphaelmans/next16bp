# Phase 3: Auth Entry Points (Owner vs Player)

**Dependencies:** Phase 1 route contract
**Parallelizable:** Yes

## Objective

Add owner-specific auth entry (`/register/owner`) and only show a Player vs Owner chooser on `/register` when intent is unknown.

---

## Shared / Contract

Intent rules:

```text
If redirect query param points to /owner/* => owner intent is known
Else => intent is unknown
```

Redirect rules:
- `redirect` query param always wins.
- If no `redirect` param on owner register, default redirect is `/owner/get-started`.

---

## Server / Backend

- [ ] N/A (no new endpoints required for basic behavior)

Notes:
- This must work for password signup, Google OAuth, and magic link flows.
- Do not introduce logic that only runs for password signup.

---

## Client / Frontend

### /register/owner

- [ ] Add route: `src/app/(auth)/register/owner/page.tsx`.
- [ ] Render the existing `RegisterForm` but force owner copy and default redirect.

Recommended implementation approach:
- Refactor `RegisterForm` to accept an optional config:
  - `title`, `description`
  - `defaultRedirect`
  - `hideRoleChooser`

### /register

- [ ] Add a role chooser card only when intent is unknown.
- [ ] If user selects Owner:
  - navigate to `/register/owner?redirect=/owner/get-started`.

Copy requirements:
- Owner path: mention verification requirement and that they will land in Owner Setup.

---

## Acceptance Criteria

- [ ] `/register/owner` exists and flows to `/owner/get-started` after signup.
- [ ] `/register` shows role chooser only when intent is unknown.
- [ ] Booking redirects still work (explicit `redirect` keeps returning to the booking flow).
