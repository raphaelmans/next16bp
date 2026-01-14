# Phase 3: All Forms Migration Checklist

**Dependencies:** Phase 1 complete
**Parallelizable:** Yes
**User Stories:** US-02-05, US-02-06 (form UX consistency)

---

## Objective

Track every form that must migrate to the StandardForm + RHF pattern. Use this checklist as the authoritative migration tracker.

---

## Forms to Migrate

### Owner

- [x] `src/features/owner/components/court-form.tsx` (reference implementation)
- [ ] `src/features/owner/components/place-form.tsx`
- [ ] `src/features/owner/components/removal-request-modal.tsx`
- [ ] `src/app/(owner)/owner/settings/page.tsx` (multiple forms: profile + payment methods)
- [ ] `src/app/(owner)/owner/courts/setup/page.tsx` (uses CourtForm; ensure wrapper aligns with new patterns)
- [ ] `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` (uses CourtForm; ensure wrapper aligns with new patterns)

### Admin

- [ ] `src/app/(admin)/admin/courts/new/page.tsx`

### Organization

- [ ] `src/features/organization/components/organization-form.tsx`
- [ ] `src/app/(auth)/owner/onboarding/organization-form-client.tsx`

### Auth

- [ ] `src/features/auth/components/login-form.tsx`
- [ ] `src/features/auth/components/register-form.tsx`
- [ ] `src/features/auth/components/magic-link-form.tsx`

### Reservation / Client

- [ ] `src/features/reservation/components/profile-form.tsx`
- [ ] `src/features/reservation/components/payment-proof-form.tsx`

---

## Checklist Rules

- Use `zodResolver(schema)` with `mode: "onChange"`.
- Use StandardForm components for all fields.
- Use `mutateAsync` only; never `mutate` in form submit.
- Toast-only server errors; no inline root error for server responses.
- `reset()` on success only.
- Disable submit when `!isDirty || !isValid || isSubmitting` unless explicitly overridden.

---

## Notes

- Keep CourtForm as the canonical pattern for the rest of the migrations.
- If a form uses a custom UI widget (country picker, file uploader), wrap it with `StandardFormField`.
