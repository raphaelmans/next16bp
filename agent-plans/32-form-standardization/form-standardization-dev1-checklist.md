# Developer 1 Checklist

**Focus Area:** StandardForm foundation + CourtForm migration
**Modules:** 1A, 1B, 1C, 2A

---

## Module 1A: StandardForm Components

**Reference:** `32-01-courtform-foundation.md`

### Setup

- [ ] Create `src/components/form/` directory structure.
- [ ] Implement `context.tsx` and `types.ts`.

### Implementation

- [ ] Add `StandardFormProvider` using `FormProvider` and layout context.
- [ ] Add `StandardFormError` (root errors only).
- [ ] Add field components (`Input`, `Select`, `Checkbox`, `Field`).
- [ ] Export components from `src/components/form/index.ts`.

### Testing

- [ ] Typecheck for `FieldValues` generics.
- [ ] Spot-check layout/label rendering in CourtForm.

---

## Module 1B: CourtForm Migration

**Reference:** `32-01-courtform-foundation.md`

### Implementation

- [ ] Replace local state with RHF (`useForm`, `zodResolver`).
- [ ] Use StandardForm fields for inputs/selects/checkbox.
- [ ] Use `mutateAsync` path for submit.
- [ ] Reset on success only.
- [ ] Toast on server error only.

### Testing

- [ ] Error submit keeps values.
- [ ] Successful submit clears dirty state.

---

## Module 1C: Court Setup Integration

### Implementation

- [ ] Update setup page to call `submitAsync` only.
- [ ] Keep step navigation logic unchanged.

### Testing

- [ ] Court creation still advances to schedule step.
- [ ] Edit details path still works.

---

## Module 2A: Migration Checklist

- [ ] Add checklist doc `32-02-form-migration-checklist.md`.
- [ ] Include migration order and regression checks.

---

## Final Checklist

- [ ] No form reset on server error.
- [ ] Consistent submit disable rules.
- [ ] Toasts render for server errors.
