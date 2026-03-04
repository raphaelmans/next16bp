# Next16 Supabase + Drizzle Auth Boilerplate

This boilerplate is pre-wired for:

- Email/password auth
- Magic-link auth
- Google OAuth auth
- Protected and guest route guards via `src/common/app-routes.ts`
- User role provisioning (`user_roles`)
- Profile provisioning and edit flow (`profile`)

## 1. Install

```bash
pnpm install
```

## 2. Configure Environment

Copy and edit env values:

```bash
cp .env.example .env.local
```

Required vars:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (recommended, especially for OAuth redirects)

## 3. Configure Supabase Auth

In Supabase Dashboard:

1. Enable Email provider.
2. Enable Google provider (if you need Google login).
3. Set Site URL to your app URL (for local: `http://localhost:3000`).
4. Add redirect URL: `http://localhost:3000/auth/callback` (and your production callback URL).

## 4. Create/Sync Database Tables

Push Drizzle schema (creates `user_roles` and `profile` tables):

```bash
pnpm db:push
```

## 5. Run

```bash
pnpm dev
```

## Auth Route Behavior

- Guest-only routes: `/login`, `/register`, `/magic-link`
- Protected routes: `/dashboard`, `/post-login`, `/account/*`
- Guard logic: `src/proxy.ts`
- Safe redirect sanitization: `src/common/redirects.ts`
