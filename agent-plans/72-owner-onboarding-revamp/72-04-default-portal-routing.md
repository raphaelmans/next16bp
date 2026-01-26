# Phase 5: Default Portal Routing (Post-login SSR)

**Dependencies:** Decision on persistence strategy
**Parallelizable:** Partial

## Objective

When users log in without an explicit `redirect` query param:
- owners should land in `/owner`
- players should land in `/home` (or the current default)

This must work SSR-side (no localStorage dependence).

---

## Shared / Contract

Redirect precedence:

```text
1) If redirect query param exists => honor it.
2) Else route via /post-login (server decides).
```

Post-login decision table:

| Condition | Redirect |
|----------|----------|
| defaultPortal=owner AND hasOrg | `/owner` |
| defaultPortal=owner AND noOrg | `/owner/get-started` |
| defaultPortal=player | `/home` |

---

## Server / Backend

### Persistence (choose one)

Option A (recommended): `user_preferences`
- New table keyed by `user_id`.
- Column: `default_portal` enum/text (`player`/`owner`).

Option B: extend `user_roles`
- Add column `default_portal` to `user_roles`.

### Post-login router

- [ ] Add a server page `src/app/(auth)/post-login/page.tsx` that:
  - calls `requireSession()`
  - queries preference + org existence
  - redirects to the correct destination

### Setting the preference

- [ ] Set `defaultPortal=owner` when an org is created (best place: organization service).

---

## Client / Frontend

- [ ] Update login/register fallback redirects to point to `/post-login` when `redirect` param is missing.
  - Login form currently falls back to `/home`.
  - Register form currently falls back to `/courts`.
  - Proposed: unify to `/post-login`.

---

## Acceptance Criteria

- [ ] Logging in without a `redirect` sends an owner to `/owner` (once org exists).
- [ ] Logging in without a `redirect` sends a new owner (no org) to `/owner/get-started`.
- [ ] Logging in without a `redirect` sends a player to `/home`.
- [ ] Explicit `redirect` keeps working (booking flows unaffected).
