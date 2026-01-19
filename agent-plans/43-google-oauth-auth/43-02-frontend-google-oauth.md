# Phase 2: Client Buttons + Hooks

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** `US-00-01`

---

## Objective

Add Google sign-in buttons to the login and register forms using shadcn Button and a new tRPC-based mutation hook, keeping the flow server-driven.

---

## Module 2A: Login Form Google Button

### Files

- `src/features/auth/hooks/use-auth.ts`
- `src/features/auth/components/login-form.tsx`
- `src/components/ui/spinner.tsx` (existing)

### UI Layout

```
[ Continue with Google ]
────────── or ──────────
[ Email / Password Form ]
```

### Implementation Steps

1. Add `useLoginWithGoogle()` hook calling `trpc.auth.loginWithGoogle`.
2. Add a secondary button in login form (outline, full width) that:
   - calls `mutateAsync({ next: redirectUrl })`
   - redirects to `data.url` via `window.location.assign`
   - shows spinner while pending
3. Keep existing login flow unchanged.

---

## Module 2B: Register Form Google Button

### Files

- `src/features/auth/components/register-form.tsx`
- `src/features/auth/hooks/use-auth.ts`

### Implementation Steps

1. Reuse `useLoginWithGoogle()` hook.
2. Add the same Google button (outline, full width) above the existing form or before submit CTA.
3. Pass `next` based on existing `redirect` query logic.

---

## Testing Checklist

- [ ] Google button is visible on both `/login` and `/register`.
- [ ] Clicking Google button starts OAuth redirect without client supabase usage.
- [ ] Buttons show loading state during mutation.
