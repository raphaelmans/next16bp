# [01-16] Auth Email Templates + Redirect Continuity

> Date: 2026-01-27
> Previous: 01-15-availability-empty-state-ux.md

## Summary

Implemented redirect-safe Supabase PKCE email flows (magic link + confirm signup + recovery + invite) and upgraded transactional email templates to match the KudosCourts design system. Verified redirects work end-to-end and pushed Auth config + templates to the linked Supabase project via CLI.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/auth/confirm/route.ts` | Accept `redirect` (and `next` alias), prevent self-redirect loops, and support additional OTP types (`invite`, `email_change`, `email`). |

### Supabase (Config-as-Code)

| File | Change |
|------|--------|
| `supabase/config.toml` | Set `site_url` + redirect allowlist for `kudoscourts.com` and localhost; configure branded email subjects; point `auth.email.template.*` to `supabase/templates/*.html`. |
| `supabase/templates/magic_link.html` | Branded, table-based transactional email with teal CTA and safe fallback link; preserves redirect continuity. |
| `supabase/templates/confirmation.html` | Branded confirm-signup email; preserves redirect continuity. |
| `supabase/templates/recovery.html` | Branded password recovery email; preserves redirect continuity. |
| `supabase/templates/invite.html` | Branded invite email; preserves redirect continuity. |

### Documentation

| File | Change |
|------|--------|
| `guides/server/supabase/auth.md` | Document redirect URL config, template strategy (`{{ .RedirectTo }} + token_hash + type`), and pushing via `supabase config push`. |
| `docs/court-owner-onboarding/00-overview.md` | Note that owner onboarding redirects are preserved for magic links and signup confirmation. |

## Key Decisions

- Keep `redirect` as the canonical return param across the app; accept `next` only as a compatibility alias in `/auth/confirm`.
- Use Supabase template variable `{{ .RedirectTo }}` as the base URL (already contains `/auth/confirm?redirect=...`) and append `token_hash` + `type` to preserve redirects without query parsing issues.
- Manage templates as code in `supabase/templates/*` and deploy via `supabase config push` (no manual Dashboard copy/paste required).

## Commands to Continue

```bash
# Push Supabase Auth config + templates
supabase config push --project-ref dgcmgarzwbjdgitdllcl

# App validation
pnpm build
pnpm lint
```
