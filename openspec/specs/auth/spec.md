# Auth & Profile Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Auth & Profile domain handles user authentication, session management, and user profile data. It serves as the bridge between Supabase Auth (identity) and the application's internal user representation.

## Data Model

Based on `src/lib/shared/infra/db/schema/profile.ts` (and Supabase `auth.users`):

### `auth.users` (Supabase)
- Managed externally by Supabase.
- Handles email/password, magic links, and OAuth providers (Google).

### `Profile`
- **Identity**: `id` (UUID)
- **Link**: `userId` (FK to `auth.users`)
- **Public Info**: `displayName`, `avatarUrl`
- **Contact**: `email` (synced/fallback), `phoneNumber`
- **Status**: `isOnboarded`

### `UserPreference`
- **Identity**: `id`, `userId`
- **Settings**: Notification preferences, locale, etc.

## API & Actions

Based on `src/lib/modules/auth/auth.router.ts` and `src/lib/modules/profile/profile.router.ts`:

### Authentication (`auth.*`)
- **`login`**: Email/Password sign-in.
- **`loginWithMagicLink`**: Passwordless email sign-in.
- **`loginWithGoogle`**: OAuth flow initiation.
- **`register`**: Create new account.
- **`logout`**: Terminate session.
- **`me`**: Get current session metadata.
- **`requestEmailOtp` / `verifyEmailOtp`**: OTP-based authentication flows.

### Profile Management (`profile.*`)
- **`me`**: Get current user's profile (auto-creates if missing).
- **`update`**: Modify display name, phone, etc.
- **`uploadAvatar`**: Handle profile picture uploads.
- **`getById`**: View public profile of another user.

## Key Logic

- **Dual Identity**: The system maintains a separation between the *Auth User* (credentials, security) and the *Profile* (application data).
- **Auto-Creation**: The `profile.me` endpoint implements a "get or create" pattern to ensure a profile exists for every authenticated user.
- **Rate Limiting**: Sensitive auth actions (OTP requests, login attempts) are protected by strict rate limiters (`authEmailSend`, etc.).
