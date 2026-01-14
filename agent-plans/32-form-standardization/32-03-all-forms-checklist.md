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
- [x] `src/features/owner/components/place-form.tsx`
- [x] `src/features/owner/components/removal-request-modal.tsx`
- [x] `src/app/(owner)/owner/settings/page.tsx` (multiple forms: profile + payment methods)
- [x] `src/app/(owner)/owner/courts/setup/page.tsx` (uses CourtForm; ensure wrapper aligns with new patterns)
- [x] `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` (uses CourtForm; ensure wrapper aligns with new patterns)

### Admin

- [x] `src/app/(admin)/admin/courts/new/page.tsx`

### Organization

- [x] `src/features/organization/components/organization-form.tsx`
- [x] `src/app/(auth)/owner/onboarding/organization-form-client.tsx`

### Auth

- [x] `src/features/auth/components/login-form.tsx`
- [x] `src/features/auth/components/register-form.tsx`
- [x] `src/features/auth/components/magic-link-form.tsx`

### Reservation / Client

- [x] `src/features/reservation/components/profile-form.tsx`
- [x] `src/features/reservation/components/payment-proof-form.tsx`

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
