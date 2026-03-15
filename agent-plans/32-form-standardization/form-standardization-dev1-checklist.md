# Developer 1 Checklist

**Focus Area:** StandardForm foundation + CourtForm migration
**Modules:** 1A, 1B, 1C, 2A

---

## Module 1A: StandardForm Components

**Reference:** `32-01-courtform-foundation.md`

### Setup

- [x] Create `src/components/form/` directory structure.
- [x] Implement `context.tsx` and `types.ts`.

### Implementation

- [x] Add `StandardFormProvider` using `FormProvider` and layout context.
- [x] Add `StandardFormError` (root errors only).
- [x] Add field components (`Input`, `Select`, `Checkbox`, `Field`).
- [x] Export components from `src/components/form/index.ts`.

### Testing

- [x] Typecheck for `FieldValues` generics.
- [x] Spot-check layout/label rendering in CourtForm.

---

## Module 1B: CourtForm Migration

**Reference:** `32-01-courtform-foundation.md`

### Implementation

- [x] Replace local state with RHF (`useForm`, `zodResolver`).
- [x] Use StandardForm fields for inputs/selects/checkbox.
- [x] Use `mutateAsync` path for submit.
- [x] Reset on success only.
- [x] Toast on server error only.

### Testing

- [x] Error submit keeps values.
- [x] Successful submit clears dirty state.

---

## Module 1C: Court Setup Integration

### Implementation

- [x] Update setup page to call `submitAsync` only.
- [x] Keep step navigation logic unchanged.

### Testing

- [x] Court creation still advances to schedule step.
- [x] Edit details path still works.

---

## Module 2A: Migration Checklist

- [x] Add checklist doc `32-02-form-migration-checklist.md`.
- [x] Include migration order and regression checks.

---

## Final Checklist

- [x] No form reset on server error.
- [x] Consistent submit disable rules.
- [x] Toasts render for server errors.
