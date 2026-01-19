# [00-64] Local OAuth Redirect

> Date: 2026-01-19
> Previous: 00-63-form-dirty-submit.md

## Summary

Adjusted runtime env handling so development ignores production `NEXT_PUBLIC_APP_URL`, preventing OAuth redirects from forcing the prod domain during local login.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/env/index.ts` | Added dev-only runtime filtering for `NEXT_PUBLIC_APP_URL` when it’s non-local. |

## Key Decisions

- Prefer request host for local development by ignoring production app URL when `NODE_ENV=development`.

## Next Steps (if applicable)

- [ ] Add local callback URL to Supabase Auth redirect allow list.
- [ ] Restart dev server and re-test Google OAuth login.

## Commands to Continue

```bash
pnpm dev
```
