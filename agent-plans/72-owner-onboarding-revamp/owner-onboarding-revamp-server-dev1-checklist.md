# Owner Onboarding Revamp - Server Dev1 Checklist

## Shared / Contract

- [x] Confirm redirect precedence rule and post-login decision table.
- [x] Confirm where the "default portal" preference will live (recommended: `user_preferences`).

## Server / Backend

### Persistence

- [x] Add DB migration for default portal preference.
- [x] Add Drizzle schema for preference table/column.
- [x] Add repository helpers to read/write preference by userId.

### Post-login SSR router

- [x] Implement `/post-login` server route that:
  - requires session
  - reads default portal preference
  - checks whether user has an organization
  - redirects according to the decision table

### Setting the preference

- [x] On organization creation, set `defaultPortal=owner`.
- [x] Ensure explicit `redirect` flows remain unchanged.

## Client / Frontend

- [x] Coordinate with client dev to switch login/register fallbacks to `/post-login`.

## Validation

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `TZ=UTC pnpm build`
