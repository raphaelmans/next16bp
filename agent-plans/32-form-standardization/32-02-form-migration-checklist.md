# Phase 2: Form Migration Checklist

**Dependencies:** Phase 1 complete
**Parallelizable:** Yes
**User Stories:** US-02-05, US-02-06 (form UX consistency)

---

## Objective

Provide a reusable, step-by-step checklist to migrate remaining forms to the StandardForm + RHF pattern established in Phase 1.

---

## Checklist Template (Use Per Form)

### Pre-Migration Audit

- [ ] Identify current form component file and its schema file.
- [ ] Confirm zod schema exists (`*.schema.ts`) or create one.
- [ ] Locate usage of `useState` for form fields.
- [ ] Identify existing error handling (toast vs inline).

### RHF + StandardForm Migration

- [ ] Add `useForm` with `zodResolver(schema)` and `mode: "onChange"`.
- [ ] Replace manual `useState` with RHF fields.
- [ ] Swap `Label/Input/Select` to `StandardFormInput/Select/Checkbox` or `StandardFormField` for custom UI.
- [ ] Ensure submit uses `mutateAsync` and returns a promise.
- [ ] On success: `form.reset(submittedValues)`.
- [ ] On server error: show toast only; do **not** reset.
- [ ] Disable submit when `!isDirty || !isValid || isSubmitting`.

### Default Values & Reset Rules

- [ ] Use `defaultValues` from props or schema defaults.
- [ ] If server data pre-fills form, call `reset(mappedData)` inside `useEffect` when identity changes.
- [ ] Avoid resetting on re-render or on submit error.

### Validation & UX

- [ ] Inline validation messages via `FormMessage` (automatic).
- [ ] Use `StandardFormError` only for validation/root errors if needed.
- [ ] Keep toast messaging for server errors.

### Regression Checks

- [ ] Inputs stay intact after server error.
- [ ] Form resets on success.
- [ ] Submit disabled when invalid or pristine.
- [ ] Loading state and button text consistent.

---

## Suggested Migration Order

1. `src/features/owner/components/court-form.tsx` (reference implementation)
2. `src/features/owner/components/place-form.tsx`
3. `src/features/organization/components/organization-form.tsx`
4. `src/features/reservation/components/profile-form.tsx`
5. `src/app/(owner)/owner/settings/page.tsx` (multiple forms)
6. Auth forms (`login-form`, `register-form`, `magic-link-form`) if desired

---

## Notes

- For complex selects (e.g., country picker), keep custom UI in `StandardFormField`.
- Preserve existing business logic (API calls, redirects) while changing only form state management.
- Use `trpc.useUtils()` for invalidations after mutation success.
