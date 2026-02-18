# Auth (Mobile v1)

## Endpoint

- `GET /api/mobile/v1/auth/me`
  - Auth: Bearer token required
  - Response: `{ data: { id, email, role } }`

## Implementation

- Session extraction:
  - Parse `Authorization: Bearer <token>`.
  - Validate token with Supabase.
  - Load role from `user_roles`.

Files:
- `src/lib/shared/infra/auth/mobile-session.ts`
- `src/app/api/mobile/v1/auth/me/route.ts`

## Expo client usage

- Mobile app stores Supabase access token in SecureStore.
- Attach token as Bearer on each request.
- On 401: refresh Supabase session, retry request.
