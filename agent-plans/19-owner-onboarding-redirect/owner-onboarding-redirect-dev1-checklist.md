# Developer 1 Checklist

**Focus Area:** Owner onboarding redirect hardening  
**Modules:** 1A, 1B, 2A, 2B

---

## Module 1A: Server tRPC Caller Helper

**Reference:** `19-01-server-guard.md`  
**User Story:** `US-00-05`

### Implementation

- [ ] Create `src/shared/infra/trpc/server.ts`
- [ ] Build `createServerCaller()` with `createContext`
- [ ] Export helper for server components

### Testing

- [ ] Verify server call to `organization.my()` works

---

## Module 1B: Onboarding Server Redirect Logic

**Reference:** `19-01-server-guard.md`  
**User Story:** `US-01-01`

### Implementation

- [ ] Remove client hooks from onboarding page
- [ ] Add `dynamic = "force-dynamic"`
- [ ] Add server-side redirect guard

### Testing

- [ ] Unauthed → login redirect
- [ ] Has org → redirect to create place

---

## Module 2A: Client Wrapper for Organization Form

**Reference:** `19-02-client-cleanup.md`  
**User Story:** `US-01-01`

### Implementation

- [ ] Create `organization-form-client.tsx` with `useRouter`
- [ ] Hook form callbacks to navigate

---

## Module 2B: Remove Client Redirect Loops

**Reference:** `19-02-client-cleanup.md`  
**User Story:** `US-00-05`

### Implementation

- [ ] Remove onboarding redirects from owner pages
- [ ] Add fallback CTA when org missing

---

## Final Checklist

- [ ] Lint passes
- [ ] Build passes
- [ ] Redirect loop resolved
