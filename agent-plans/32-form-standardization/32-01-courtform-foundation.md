# Phase 1: CourtForm Standardization

**Dependencies:** None
**Parallelizable:** Partial (1A must precede 1B/1C)
**User Stories:** US-02-05, US-02-06

---

## Objective

Implement the StandardForm component layer and migrate the CourtForm to react-hook-form with Zod validation, ensuring submit errors do not clear inputs and submit flows use `mutateAsync`.

---

## Modules

### Module 1A: StandardForm Component Foundation

**User Story:** US-02-05 (indirect UX consistency)
**Reference:** `guides/client/references/09-standard-form-components.md`

#### Directory Structure

```
src/components/form/
├── context.tsx
├── types.ts
├── StandardFormProvider.tsx
├── StandardFormError.tsx
├── fields/
│   ├── StandardFormInput.tsx
│   ├── StandardFormSelect.tsx
│   ├── StandardFormCheckbox.tsx
│   └── StandardFormField.tsx
└── index.ts
```

#### Implementation Notes

- Mirror the guide definitions for layout, labels, and error rendering.
- Build on existing `src/components/ui/form.tsx` primitives.
- `StandardFormError` should only show `formState.errors.root` (used for validation or manual errors, not server error toasts).

#### Testing Checklist

- [ ] Types compile with `strict` TS
- [ ] Example usage compiles in CourtForm

---

### Module 1B: CourtForm RHF Migration

**User Story:** US-02-05, US-02-06
**Reference:** `src/features/owner/components/court-form.tsx`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `placeId` | select | Yes | `uuid` ("Place is required") |
| `sportId` | select | Yes | `uuid` ("Sport is required") |
| `label` | text | Yes | min 1, max 100 |
| `tierLabel` | text | No | max 20 |
| `isActive` | checkbox | No | boolean |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│  Court Details (Card)                       │
│  [Place Select]                             │
│  [Sport Select]                             │
│  [Court Label]                              │
│  [Tier Label]                               │
│  [Is Active] (edit only)                    │
└─────────────────────────────────────────────┘
[Cancel]                              [Submit]
```

#### Implementation Steps

1. Replace local `useState` form state with `useForm<CourtFormData>`.
2. Use `zodResolver(courtFormSchema)` with `mode: "onChange"`.
3. Use StandardForm components for fields (Input, Select, Checkbox).
4. Convert submit to `async` and call `onSubmit` prop in a `try/catch`.
5. On success: `form.reset(submittedValues)`.
6. On error: show toast only; **do not** reset form.
7. Disable submit when `!isDirty || !isValid || isSubmitting`.

#### Code Example

```ts
const form = useForm<CourtFormData>({
  resolver: zodResolver(courtFormSchema),
  mode: "onChange",
  defaultValues: { ...defaultCourtFormValues, ...defaultValues },
});

const onSubmit = async (values: CourtFormData) => {
  await props.onSubmit(values); // uses mutateAsync upstream
  form.reset(values);           // success only
};
```

---

### Module 1C: Court Setup Submit Integration

**User Story:** US-02-05
**Reference:** `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`

#### Flow Diagram

```
CourtForm submit
    │
    ▼
submitAsync (mutateAsync)
    │
    ├─ success → toast success + advance step + form.reset
    └─ error   → toast error (no reset)
```

#### Implementation Steps

1. Ensure submit path uses `submitAsync` only.
2. Keep step-advance logic separate from form state.
3. Remove manual form state sync in page.

#### Testing Checklist

- [ ] Error response keeps input values
- [ ] Success clears dirty state
- [ ] Step navigation unchanged

---

## Phase Completion Checklist

- [ ] StandardForm components available in `src/components/form/`
- [ ] CourtForm uses RHF + Zod and matches guides
- [ ] Court setup submit uses `mutateAsync` + toast-only errors
- [ ] No form reset on error
